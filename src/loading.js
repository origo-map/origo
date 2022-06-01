/**
 * Show the global loading indicator
 */
export function showLoading() {
  document.getElementById("loading").classList.remove("hide");
}

/**
 * Hide the global loading indicator
 */
export function hideLoading() {
  document.getElementById("loading").classList.add("hide");
}

/**
 * Show the loading indicator while the promise runs
 *
 * @param {() => Promise<void>} cb
 */
export async function withLoading(cb) {
  showLoading();
  try {
    await cb();
  } finally {
    hideLoading();
  }
}
