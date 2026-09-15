import "./globals.css";
import Sidebar from "@/components/Sidebar";
import SearchBar from "@/components/SearchBar";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function getBusinessName() {
  const { data } = await supabase.from("settings").select("business_name").limit(1).single();
  return data?.business_name || "Carpet Cleaning Co.";
}

export async function generateMetadata() {
  const name = await getBusinessName();
  return { title: `Paneli · ${name}` };
}

export default async function RootLayout({ children }) {
  const businessName = await getBusinessName();

  return (
    <html lang="sq">
      <body>
        <div className="app-shell">
          <Sidebar businessName={businessName} />
          <div className="main-col">
            <header className="topbar">
              <SearchBar />
            </header>
            <main className="content">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
