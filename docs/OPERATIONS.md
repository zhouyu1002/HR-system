# 維運與故障排除

## 日常檢查

- 確認網站可以正常開啟。
- 確認最新版本部署成功。
- 匯入測試 Excel，確認統計數字合理。
- 檢查瀏覽器 Console 是否出現 JavaScript 錯誤。

## Excel 匯入異常

1. 確認檔案格式為 `.xlsx`、`.xls` 或 `.csv`。
2. 確認主要欄位名稱未被修改。
3. 確認 Excel 第一個工作表包含出勤資料。
4. 重新整理頁面後再次匯入。
5. 若仍異常，保留問題檔案的欄位結構，供程式維護人員檢查。

## GitHub Pages 部署異常

1. 開啟 Repository 的 Actions。
2. 查看最新 `Deploy HR War Room` workflow。
3. 若 Build 失敗，先檢查 npm 套件與程式碼錯誤。
4. 若 Build 成功但 Deploy 失敗，檢查 GitHub Pages 是否啟用，以及 Pages 的 Source 是否設定為 GitHub Actions。

## 正式環境變更

任何正式環境變更建議先在測試環境驗證，再發布到正式環境，並保留 Git commit 紀錄。
