"use client";

import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

export default function ReportsCharts({ labels, revenueSeries, ordersSeries, statusCounts, paidVsUnpaid }) {
  const revenueRef = useRef(null);
  const ordersRef = useRef(null);
  const statusRef = useRef(null);
  const paidRef = useRef(null);
  const chartsRef = useRef([]);

  useEffect(() => {
    chartsRef.current.forEach((c) => c.destroy());
    chartsRef.current = [];

    chartsRef.current.push(
      new Chart(revenueRef.current, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Revenue (€)",
              data: revenueSeries,
              borderColor: "#2563eb",
              backgroundColor: "rgba(37,99,235,.08)",
              fill: true,
              tension: 0.3,
            },
          ],
        },
        options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
      })
    );

    chartsRef.current.push(
      new Chart(ordersRef.current, {
        type: "bar",
        data: { labels, datasets: [{ label: "Orders", data: ordersSeries, backgroundColor: "#16a34a" }] },
        options: {
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
        },
      })
    );

    chartsRef.current.push(
      new Chart(statusRef.current, {
        type: "doughnut",
        data: {
          labels: Object.keys(statusCounts),
          datasets: [
            {
              data: Object.values(statusCounts),
              backgroundColor: ["#94a3b8", "#4338ca", "#b45309", "#c2410c", "#047857", "#1d4ed8", "#15803d"],
            },
          ],
        },
        options: { plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 11 } } } } },
      })
    );

    chartsRef.current.push(
      new Chart(paidRef.current, {
        type: "doughnut",
        data: {
          labels: Object.keys(paidVsUnpaid),
          datasets: [{ data: Object.values(paidVsUnpaid), backgroundColor: ["#16a34a", "#d97706", "#dc2626"] }],
        },
        options: { plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 11 } } } } },
      })
    );

    return () => {
      chartsRef.current.forEach((c) => c.destroy());
      chartsRef.current = [];
    };
  }, [labels, revenueSeries, ordersSeries, statusCounts, paidVsUnpaid]);

  return (
    <div className="chart-grid">
      <div className="chart-card">
        <h4>Të Ardhurat me Kohë (pagesat e pranuara)</h4>
        <canvas ref={revenueRef}></canvas>
      </div>
      <div className="chart-card">
        <h4>Porositë me Kohë (krijuar)</h4>
        <canvas ref={ordersRef}></canvas>
      </div>
      <div className="chart-card">
        <h4>Porositë sipas Statusit</h4>
        <canvas ref={statusRef}></canvas>
      </div>
      <div className="chart-card">
        <h4>Paguar vs Papaguar</h4>
        <canvas ref={paidRef}></canvas>
      </div>
    </div>
  );
}
