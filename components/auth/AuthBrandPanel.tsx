import { Check } from "lucide-react";

export function AuthBrandPanel() {
  return (
    <section className="login-brand-panel">
      <div className="login-left-content">
        <div className="login-message">
          <h1>บริหารทุกหอ<br />จากที่เดียว</h1>
          <p>ดูสถานะห้อง จัดการผู้เช่า ออกบิล และติดตามรายรับในระบบที่ทีมงานใช้งานร่วมกันได้</p>
        </div>
        <ul className="login-benefits">
          <li><Check size={17} /> แยกข้อมูลแต่ละกิจการอย่างปลอดภัย</li>
          <li><Check size={17} /> กำหนด Role และสิทธิ์ได้ละเอียด</li>
          <li><Check size={17} /> รองรับบริการเสริมตามแพ็กเกจ</li>
        </ul>
      </div>
    </section>
  );
}
