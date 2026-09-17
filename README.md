# HR-system｜出勤戰情室

專為「員工刷卡資料明細表」設計的網頁版出勤儀表板。

## 功能
- 手動匯入 `.xlsx` / `.xls` / `.csv`
- 讀取第一個工作表，自動辨識欄位
- 今日總人數、正常人數、異常人數、出勤率 KPI
- 正常／異常圓餅圖、各部門出勤率長條圖
- 異常人員清單
- 部門、狀態、關鍵字篩選
- 休息日不列入出勤率分母
- 「正常／休息日／免刷」歸類為正常；其他上班判讀歸類為異常
- Excel 在瀏覽器前端解析，不上傳到伺服器
- GitHub Pages 可直接部署

## 本機執行
```bash
npm install
npm run dev
```

## 建置
```bash
npm run build
```

## GitHub Pages
已附 `.github/workflows/deploy.yml`。將 Repository 的 Pages 設定為 **GitHub Actions** 後，push 到 `main` 即可自動建置與部署。
