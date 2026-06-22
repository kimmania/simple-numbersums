export function initHelp(): void {
  const dialog = document.getElementById('help-dialog') as HTMLDialogElement | null;
  const openBtn = document.getElementById('help');
  if (!dialog || !openBtn) return;

  openBtn.addEventListener('click', () => dialog.showModal());

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
}
