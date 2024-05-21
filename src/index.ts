import { totp } from 'otplib';
import crypto from 'crypto';

// Configure otplib to use the crypto-browserify library
totp.options = { crypto };

const form = document.getElementById('totp-form') as HTMLFormElement;
const friendlyNameInput = document.getElementById('friendly-name') as HTMLInputElement;
const secretKeyInput = document.getElementById('secret-key') as HTMLInputElement;
const totpList = document.getElementById('totp-list') as HTMLDivElement;

interface TOTPEntry {
  friendlyName: string;
  secretKey: string;
}

function getStoredTOTPs(): TOTPEntry[] {
  const stored = localStorage.getItem('totp-entries');
  return stored ? JSON.parse(stored) : [];
}

function saveStoredTOTPs(entries: TOTPEntry[]) {
  localStorage.setItem('totp-entries', JSON.stringify(entries));
}

function deleteTOTP(index: number) {
  const entries = getStoredTOTPs();
  entries.splice(index, 1);
  saveStoredTOTPs(entries);
  updateTOTPDisplay();
}

function updateTOTPDisplay() {
  const entries = getStoredTOTPs();
  totpList.innerHTML = '';
  entries.forEach((entry, index) => {
    const token = totp.generate(entry.secretKey);
    const div = document.createElement('div');
    div.className = 'token';
    div.innerHTML = `
      <strong>${entry.friendlyName}:</strong> ${token}
      <span class="delete-btn" data-index="${index}">&times;</span>
    `;
    totpList.appendChild(div);
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (event) => {
      const index = (event.target as HTMLElement).getAttribute('data-index');
      if (index !== null && confirm('Are you sure you want to delete this TOTP?')) {
        deleteTOTP(parseInt(index));
      }
    });
  });
}

function scheduleNextUpdate() {
  const now = new Date();
  const seconds = now.getSeconds();
  const millis = now.getMilliseconds();
  const nextInterval = 30 - (seconds % 30);
  const delay = (nextInterval * 1000) - millis;

  setTimeout(() => {
    updateTOTPDisplay();
    setInterval(updateTOTPDisplay, 30000);
  }, delay);
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const friendlyName = friendlyNameInput.value;
  const secretKey = secretKeyInput.value;
  if (friendlyName && secretKey) {
    const entries = getStoredTOTPs();
    entries.push({ friendlyName, secretKey });
    saveStoredTOTPs(entries);
    updateTOTPDisplay();
    friendlyNameInput.value = '';
    secretKeyInput.value = '';
  }
});

// Initial display update and schedule the next update
updateTOTPDisplay();
scheduleNextUpdate();
