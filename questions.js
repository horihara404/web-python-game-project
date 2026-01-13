// questions.js
// เก็บข้อมูลโจทย์ทั้งหมดที่นี่
const gameLevels = [
    {
        id: 1,
        title: "Level 1: จุดเริ่มต้น (Variables)",
        desc: "จงสร้างตัวแปรชื่อ x ให้มีค่าเท่ากับ 5 แล้วสั่งพิมพ์ค่า x ยกกำลัง 2 ออกมา",
        expected: "25",
        // ระบบตรวจสอบกันโกง
        mustHaveVar: "x",        // ต้องมีตัวแปร x ใน Memory
        forbidden: ["print(25)", "print('25')"], // ห้ามพิมพ์คำตอบตรงๆ
        mustContain: ["*", "print"] // ต้องมีการคูณ และการ print
    },
    {
        id: 2,
        title: "Level 2: พื้นที่วงกลม (Math)",
        desc: "กำหนดให้ r = 10 จงคำนวณพื้นที่วงกลม (สูตร: r * r * 3.14) และพิมพ์ผลลัพธ์",
        expected: "314.0",
        mustHaveVar: "r",
        forbidden: ["print(314)", "314.0"],
        mustContain: ["3.14", "*"]
    },
    // สามารถเพิ่มข้อ 3, 4, 5 ต่อท้ายได้ที่นี่...
];