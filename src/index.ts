import { totp } from 'otplib';
import crypto from 'crypto';

// Configure otplib to use the crypto-browserify library
totp.options = { crypto };

const form = document.getElementById('totp-form') as HTMLFormElement;
const friendlyNameInput = document.getElementById('friendly-name') as HTMLInputElement;
const secretKeyInput = document.getElementById('secret-key') as HTMLInputElement;
const totpList = document.getElementById('totp-list') as HTMLDivElement;
const progressBar = document.getElementById('progress-bar') as HTMLDivElement;
const modal = document.getElementById('modal') as HTMLDivElement;
const editSecretKeyInput = document.getElementById('edit-secret-key') as HTMLInputElement;
const saveSecretKeyBtn = document.getElementById('save-secret-key') as HTMLButtonElement;
const closeBtn = document.getElementById('close') as HTMLSpanElement;

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

function showEditModal(index: number) {
    const entries = getStoredTOTPs();
    const entry = entries[index];
    editSecretKeyInput.value = entry.secretKey;
    modal.style.display = 'block';

    saveSecretKeyBtn.onclick = () => {
        entries[index].secretKey = editSecretKeyInput.value;
        saveStoredTOTPs(entries);
        updateTOTPDisplay();
        modal.style.display = 'none';
    };
}

function updateTOTPDisplay() {
    const entries = getStoredTOTPs();
    totpList.innerHTML = '';
    entries.forEach((entry, index) => {
        const token = totp.generate(entry.secretKey);
        const div = document.createElement('div');
        div.className = 'token';
        div.innerHTML = `
      <strong>${entry.friendlyName}</strong>
      <span>${token}</span>
      <span class="copy-btn"><i class="fas fa-copy"></i></span> <!-- Pencil icon -->
      <span class="edit-btn"><i class="fas fa-pencil-alt"></i></span> <!-- Pencil icon -->
      <span class="delete-btn"><i class="fas fa-times"></i></span> <!-- Delete icon -->
    `;
        totpList.appendChild(div);

        // Trigger animation
        requestAnimationFrame(() => {
            div.classList.add('visible');
        });
    });

    document.querySelectorAll('.delete-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this TOTP?')) {
                const tokenDiv = btn.parentElement as HTMLDivElement;
                tokenDiv.classList.remove('visible');
                setTimeout(() => deleteTOTP(index), 500); // Wait for animation to finish
            }
        });
    });

    document.querySelectorAll('.edit-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => {
            showEditModal(index);
        });
    });

    /*
    document.querySelectorAll('.copy-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => {
            const tokenDiv = btn.parentElement as HTMLDivElement;
            const token = tokenDiv.querySelector('.token-code')?.textContent;
            copyToClipboard(token);
        });
    });
    */
}

function updateProgressBar() {
    const now = new Date();
    const seconds = now.getSeconds();
    const progress = ((30 - (seconds % 30)) / 30) * 100;
    progressBar.style.width = `${progress}%`;

    // Gradually decrease the progress bar width
    const interval = 1000; // Update every second
    setTimeout(updateProgressBar, interval);
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

/*

function copyToClipboard(text: string | null | undefined) {
    // if(text) {
    //     navigator.clipboard.writeText(text);
    // }
    const textarea = document.createElement('textarea');
    textarea.value = text || "";
    textarea.style.position = 'fixed'; // Prevent scrolling to bottom
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
*/

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

closeBtn.onclick = () => {
    modal.style.display = 'none';
};

// Initial display update and schedule the next update
updateTOTPDisplay();
scheduleNextUpdate();
updateProgressBar();
