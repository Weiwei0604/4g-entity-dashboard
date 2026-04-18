// app/api/sheets/route.js
import { NextResponse } from "next/server";

const SHEET_URLS = {
  articles: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSuRgjUkp9p1JzNzyeg38zraTUFIEYIb5HDD0UherND7M_evszqPGJhzbIS2OcCZH6spsPPuJQ3XdB_/pub?output=csv&gid=0",
  entities: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSuRgjUkp9p1JzNzyeg38zraTUFIEYIb5HDD0UherND7M_evszqPGJhzbIS2OcCZH6spsPPuJQ3XdB_/pub?output=csv&gid=1334248314",
  summary:  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSuRgjUkp9p1JzNzyeg38zraTUFIEYIb5HDD0UherND7M_evszqPGJhzbIS2OcCZH6spsPPuJQ3XdB_/pub?output=csv&gid=833054468",
};

// 解析 CSV 把文字轉成陣列
function parseCSV(csvText) {
  // 把標題列拿掉
  const rows = csvText.replace(/\r/g, "").trim().split("\n").slice(1);
  
  return rows.map(row => {
    let fields = [];
    let buffer = "";
    let insideQuote = false;

    // 處理 CSV 格式
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        fields.push(buffer.trim());
        buffer = "";
      } else {
        buffer += char;
      }
    }
    fields.push(buffer.trim());
    return fields;
  });
}

export async function GET() {
  try {
    // 用 Promise.all 同步抓三張表的資料
    const responses = await Promise.all([
      fetch(SHEET_URLS.articles, { cache: "no-store" }),
      fetch(SHEET_URLS.entities, { cache: "no-store" }),
      fetch(SHEET_URLS.summary,  { cache: "no-store" })
    ]);

    // 全部轉成純文字
    const texts = await Promise.all(responses.map(res => res.text()));

    // 轉成JSON 格式
    return NextResponse.json({
      articles: parseCSV(texts[0]),
      entities: parseCSV(texts[1]),
      summary:  parseCSV(texts[2])
    });

  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json({ error: "抓取 Sheet 失敗" }, { status: 500 });
  }
}