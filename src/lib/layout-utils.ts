export function shouldHideMobileChrome(pathname: string, search = "") {
  if (pathname.endsWith("/cook")) return true;
  if (pathname === "/shopping-list" && search.includes("mode=shop")) {
    return true;
  }
  return false;
}