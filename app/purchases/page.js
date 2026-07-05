"use client";

import { useEffect, useMemo, useState } from "react";
import { getPurchases } from "@/app/lib/orders-storage";
import { supabase } from "@/app/lib/supabaseClient";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;

export default function PurchasesPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableFilter, setTableFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function loadOrders() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const data = await getPurchases();
      const sorted = [...data].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      setOrders(sorted);
      setLoading(false);
      setCurrentPage(1);
    }

    loadOrders();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [tableFilter]);

  const tableOptions = useMemo(() => {
    const tables = [...new Set(orders.map((order) => String(order.table_number)).filter(Boolean))];
    return tables.sort((a, b) => Number(a) - Number(b));
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (tableFilter === "all") return orders;
    return orders.filter((order) => String(order.table_number) === tableFilter);
  }, [orders, tableFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pagedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredOrders.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredOrders, currentPage]);

  return (
    <div className="order-shell">
      <div className="order-hero">
        <div>
          <h2 className="page-title">รายการคำสั่งซื้อ</h2>
          <p className="order-summary">
            {loading
              ? "กำลังโหลดรายการคำสั่ง..."
              : `แสดง ${filteredOrders.length} รายการ · เรียงจากล่าสุดก่อน`}
          </p>
        </div>
        <div className="order-badge">ล่าสุดก่อน</div>
      </div>

      <div className="order-toolbar">
        <div>
          <h3 className="section-title">ตัวกรองและเรียงลำดับ</h3>
          <p className="muted">เลือกโต๊ะเพื่อดูคำสั่งเฉพาะที่ต้องการ</p>
        </div>

        <div className="order-filter">
          <label className="muted" htmlFor="table-filter">กรองตามโต๊ะ</label>
          <select
            id="table-filter"
            className="select"
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
          >
            <option value="all">ทุกโต๊ะ</option>
            {tableOptions.map((table) => (
              <option key={table} value={table}>โต๊ะ {table}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="muted">กำลังโหลดรายการสั่ง...</p>
      ) : (
        <div className="panel">
          <div className="pagination-bar">
            <span className="muted">หน้า {currentPage} / {totalPages}</span>
            <div className="pagination-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
              >
                ก่อนหน้า
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
              >
                ถัดไป
              </button>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>เมนู</th>
                <th className="td-center">โต๊ะ</th>
                <th className="td-center">จำนวน</th>
                <th className="td-right">ยอด</th>
                <th>เวลา</th>
              </tr>
            </thead>
            <tbody>
              {pagedOrders.map((row) => (
                <tr key={row.id}>
                  <td>{row.product_name}</td>
                  <td className="td-center">{row.table_number}</td>
                  <td className="td-center">{row.quantity}</td>
                  <td className="td-right">{Number(row.total).toLocaleString()} ฿</td>
                  <td className="td-muted">{new Date(row.created_at).toLocaleString("th-TH")}</td>
                </tr>
              ))}
              {pagedOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-row">ไม่พบรายการสำหรับโต๊ะที่เลือก</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
