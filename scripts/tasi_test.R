# Smoke test: does tasi actually pull live Saudi/Tadawul data?
.libPaths(c("C:/Users/orhan/R/win-library/4.6", .libPaths()))
suppressMessages(library(tasi))

cat("== TASI index (last rows) ==\n")
idx <- try(get_index_records("2026-05-01", "2026-06-20"), silent = TRUE)
if (inherits(idx, "try-error")) cat("index FAILED:", conditionMessage(attr(idx, "condition")), "\n") else {
  print(utils::tail(idx, 3)); cat("index rows:", nrow(idx), "\n")
}

cat("\n== Aramco (2222) prices (last rows) ==\n")
px <- try(get_company_records("2026-05-01", "2026-06-20", company_symbol = 2222), silent = TRUE)
if (inherits(px, "try-error")) cat("price FAILED:", conditionMessage(attr(px, "condition")), "\n") else {
  print(utils::tail(px, 3)); cat("price rows:", nrow(px), "\n")
}

cat("\n== SNB (1180) quarterly income statement ==\n")
inc <- try(get_income_statement(1180, period_type = "q"), silent = TRUE)
if (inherits(inc, "try-error")) cat("income FAILED:", conditionMessage(attr(inc, "condition")), "\n") else {
  cat("income cols:", paste(utils::head(names(inc), 10), collapse = ", "), "\n")
  cat("income rows:", nrow(inc), "\n")
}
cat("\nTEST_DONE\n")
