# EquScore — install the `tasi` R package (free Saudi/Tadawul data) into a user library.
ul <- "C:/Users/orhan/R/win-library/4.6"
dir.create(ul, recursive = TRUE, showWarnings = FALSE)
.libPaths(c(ul, .libPaths()))
options(repos = c(CRAN = "https://cloud.r-project.org"))

cat("Lib path:", ul, "\n")

deps <- c("remotes", "quantmod", "dplyr", "xts", "magrittr", "rvest", "jsonlite", "httr", "stringr")
for (p in deps) {
  if (!requireNamespace(p, quietly = TRUE)) {
    cat("installing", p, "...\n")
    install.packages(p, lib = ul, quiet = TRUE)
  }
}
cat("deps done\n")

if (!requireNamespace("tasi", quietly = TRUE)) {
  cat("installing tasi from GitHub ...\n")
  remotes::install_github("Hussain-Alsalman/tasi", lib = ul, upgrade = "never", quiet = TRUE)
}
cat("tasi installed:", requireNamespace("tasi", quietly = TRUE), "\n")
cat("DONE\n")
