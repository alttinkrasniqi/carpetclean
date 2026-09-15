"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { nextOrderNumber, STATUS_STEPS, STATUS_LABELS_SQ } from "@/lib/data";

async function logHistory(orderId, message) {
  await supabase.from("order_history").insert({ order_id: orderId, message });
}

export async function createOrder(formData) {
  let customerId = formData.get("customer_id");
  const pricePerSqm = parseFloat(formData.get("price_per_sqm"));

  if (!customerId || customerId === "__new__") {
    const name = (formData.get("new_customer_name") || "").toString().trim();
    const phone = (formData.get("new_customer_phone") || "").toString().trim();
    const address = (formData.get("new_customer_address") || "").toString().trim();
    if (!name || !phone) {
      throw new Error("Emri i klientit dhe telefoni janë të detyrueshëm.");
    }
    const { data: newCustomer, error: custErr } = await supabase
      .from("customers")
      .insert({ name, phone, address })
      .select()
      .single();
    if (custErr) throw new Error(custErr.message);
    customerId = newCustomer.id;
  } else {
    customerId = parseInt(customerId, 10);
  }

  const { data: lastOrder } = await supabase
    .from("orders")
    .select("id")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  const orderNumber = nextOrderNumber(lastOrder?.id);

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      customer_id: customerId,
      status: "New Order",
      price_per_sqm: pricePerSqm,
      notes: (formData.get("notes") || "").toString().trim(),
      collection_date: formData.get("collection_date") || null,
      collection_notes: (formData.get("collection_notes") || "").toString().trim(),
    })
    .select()
    .single();

  if (orderErr) throw new Error(orderErr.message);

  const lengths = formData.getAll("carpet_length[]");
  const widths = formData.getAll("carpet_width[]");
  const labels = formData.getAll("carpet_label[]");

  const carpetRows = [];
  for (let i = 0; i < lengths.length; i++) {
    const length = parseFloat(lengths[i]);
    const width = parseFloat(widths[i]);
    if (!length || !width || length <= 0 || width <= 0) continue;
    carpetRows.push({
      order_id: order.id,
      length,
      width,
      price_per_sqm: pricePerSqm,
      label: labels[i] || `Qilimi ${i + 1}`,
    });
  }

  if (carpetRows.length === 0) {
    await supabase.from("orders").delete().eq("id", order.id);
    throw new Error("Shto të paktën një qilim me matje të vlefshme.");
  }

  const { error: carpetErr } = await supabase.from("carpets").insert(carpetRows);
  if (carpetErr) throw new Error(carpetErr.message);

  const totalSqm = carpetRows.reduce((s, c) => s + c.length * c.width, 0);
  const totalPrice = totalSqm * pricePerSqm;

  const amountPaid = parseFloat(formData.get("amount_paid"));
  let paidNote = "";
  if (amountPaid && amountPaid > 0) {
    await supabase.from("payments").insert({
      order_id: order.id,
      amount: amountPaid,
      note: "Pagesa fillestare",
    });
    paidNote = ` — €${amountPaid.toFixed(2)} u paguan menjëherë.`;
  }

  await logHistory(
    order.id,
    `Porosia u krijua: ${totalSqm.toFixed(2)} m² × €${pricePerSqm.toFixed(2)} = €${totalPrice.toFixed(2)}.${paidNote}`
  );

  revalidatePath("/");
  revalidatePath("/orders");
  revalidatePath("/customers");
  redirect(`/orders/${order.id}`);
}

export async function updateOrderStatus(orderId, status) {
  if (!STATUS_STEPS.includes(status)) return;

  const patch = { status };
  const today = new Date().toISOString().slice(0, 10);

  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).single();
  if (order) {
    if (status === "Collected" && !order.collection_date) patch.collection_date = today;
    if (status === "At Factory" && !order.factory_received_date) patch.factory_received_date = today;
    if (status === "Ready" && !order.cleaning_completed_date) patch.cleaning_completed_date = today;
    if (status === "Delivered" && !order.delivery_date) patch.delivery_date = today;
  }

  await supabase.from("orders").update(patch).eq("id", orderId);

  if (order && order.status !== status) {
    const from = STATUS_LABELS_SQ[order.status] || order.status;
    const to = STATUS_LABELS_SQ[status] || status;
    await logHistory(orderId, `Statusi u ndryshua nga "${from}" në "${to}".`);
  }

  revalidatePath("/");
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
}

export async function updateOrderDetails(orderId, formData) {
  const patch = {
    collection_date: formData.get("collection_date") || null,
    factory_received_date: formData.get("factory_received_date") || null,
    cleaning_completed_date: formData.get("cleaning_completed_date") || null,
    delivery_date: formData.get("delivery_date") || null,
    collection_notes: (formData.get("collection_notes") || "").toString().trim(),
    delivery_notes: (formData.get("delivery_notes") || "").toString().trim(),
    notes: (formData.get("notes") || "").toString().trim(),
  };
  await supabase.from("orders").update(patch).eq("id", orderId);
  await logHistory(orderId, "Datat/shënimet e porosisë u përditësuan.");
  revalidatePath(`/orders/${orderId}`);
}

export async function updateOrderCarpets(orderId, formData) {
  const pricePerSqm = parseFloat(formData.get("price_per_sqm"));
  if (!pricePerSqm || pricePerSqm <= 0) throw new Error("Vendos një çmim të vlefshëm për m².");

  const { data: before } = await supabase.from("orders").select("price_per_sqm").eq("id", orderId).single();

  const lengths = formData.getAll("carpet_length[]");
  const widths = formData.getAll("carpet_width[]");
  const labels = formData.getAll("carpet_label[]");

  const carpetRows = [];
  for (let i = 0; i < lengths.length; i++) {
    const length = parseFloat(lengths[i]);
    const width = parseFloat(widths[i]);
    if (!length || !width || length <= 0 || width <= 0) continue;
    carpetRows.push({
      order_id: orderId,
      length,
      width,
      price_per_sqm: pricePerSqm,
      label: labels[i] || `Qilimi ${i + 1}`,
    });
  }

  if (carpetRows.length === 0) throw new Error("Duhet të paktën një qilim me matje të vlefshme.");

  // replace all carpets for this order with the edited set
  await supabase.from("carpets").delete().eq("order_id", orderId);
  const { error: carpetErr } = await supabase.from("carpets").insert(carpetRows);
  if (carpetErr) throw new Error(carpetErr.message);

  await supabase.from("orders").update({ price_per_sqm: pricePerSqm }).eq("id", orderId);

  const newTotalSqm = carpetRows.reduce((s, c) => s + c.length * c.width, 0);
  const newTotal = newTotalSqm * pricePerSqm;
  const oldPriceNote = before && before.price_per_sqm !== pricePerSqm ? ` (çmimi më parë ishte €${before.price_per_sqm}/m²)` : "";

  await logHistory(
    orderId,
    `Qilimat/çmimi u ndryshuan nga përdoruesi — totali i ri: ${newTotalSqm.toFixed(2)} m² × €${pricePerSqm.toFixed(2)} = €${newTotal.toFixed(2)}${oldPriceNote}.`
  );

  revalidatePath("/");
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/reports");
}

export async function addPayment(orderId, formData) {
  const amount = parseFloat(formData.get("amount"));
  if (!amount || amount <= 0) throw new Error("Vendos një shumë të vlefshme pagese.");
  const note = (formData.get("note") || "").toString().trim();

  await supabase.from("payments").insert({ order_id: orderId, amount, note });
  await logHistory(orderId, `U regjistrua pagesë prej €${amount.toFixed(2)}${note ? ` — ${note}` : ""}.`);

  revalidatePath("/");
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
}

export async function archiveOrder(orderId) {
  await logHistory(orderId, "Porosia u arkivua.");
  await supabase.from("orders").update({ is_archived: true }).eq("id", orderId);
  revalidatePath("/orders");
  revalidatePath("/settings");
  redirect("/orders");
}

export async function restoreOrder(orderId) {
  await supabase.from("orders").update({ is_archived: false }).eq("id", orderId);
  await logHistory(orderId, "Porosia u rikthye nga arkivi.");
  revalidatePath("/settings");
  revalidatePath("/orders");
}

export async function deleteOrder(orderId) {
  // carpets, payments & history cascade-delete automatically (see supabase-schema.sql)
  await supabase.from("orders").delete().eq("id", orderId);
  revalidatePath("/");
  revalidatePath("/orders");
  revalidatePath("/customers");
  revalidatePath("/reports");
  revalidatePath("/settings");
  redirect("/orders");
}

export async function deleteCustomer(customerId) {
  // delete the customer's orders first (this cascades to carpets, payments
  // & history automatically since those tables reference orders with ON DELETE CASCADE)
  await supabase.from("orders").delete().eq("customer_id", customerId);
  await supabase.from("customers").delete().eq("id", customerId);

  revalidatePath("/customers");
  revalidatePath("/orders");
  revalidatePath("/");
  redirect("/customers");
}

export async function updateCustomer(customerId, formData) {
  const name = (formData.get("name") || "").toString().trim();
  const phone = (formData.get("phone") || "").toString().trim();
  const address = (formData.get("address") || "").toString().trim();

  if (!name || !phone) throw new Error("Emri dhe telefoni janë të detyrueshëm.");

  await supabase.from("customers").update({ name, phone, address }).eq("id", customerId);

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/orders");
  revalidatePath("/");
}

export async function updateSettings(formData) {
  const businessName = (formData.get("business_name") || "").toString().trim();
  const defaultPrice = parseFloat(formData.get("default_price_per_sqm"));

  const { data: existing } = await supabase.from("settings").select("id").limit(1).maybeSingle();
  if (existing) {
    await supabase
      .from("settings")
      .update({ business_name: businessName, default_price_per_sqm: defaultPrice })
      .eq("id", existing.id);
  } else {
    await supabase.from("settings").insert({ business_name: businessName, default_price_per_sqm: defaultPrice });
  }

  revalidatePath("/");
  revalidatePath("/settings");
}
