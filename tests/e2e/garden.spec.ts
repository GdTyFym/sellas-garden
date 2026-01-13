import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const completePreIntroGate = async (page: Page) => {
  await page.goto('/');
  await page.getByPlaceholder(/Tulis namamu/i).fill('Sella');
  await page.getByRole('button', { name: 'Lanjut' }).click();

  await page.getByRole('heading', { name: /the moon is beautiful/i }).waitFor();
  await page.getByRole('button', { name: 'Bulan' }).click();

  await page.getByRole('heading', { name: /kamu yang mana/i }).waitFor();
  for (const adjective of ['Cantik', 'Imut', 'Lucu', 'Menggemaskan']) {
    await page.getByRole('button', { name: adjective }).click();
  }
  await page.getByRole('button', { name: /^Lanjut$/ }).click();

  await page.getByText(/Pilih bunga favoritmu/i).waitFor();
  await page.getByRole('button', { name: 'Tulip' }).click();

  await page.getByText(/Tahan sebentar/i).waitFor();
  const holdButton = page.getByRole('button', { name: /Mulai|Tahan|Siap/i });
  await holdButton.evaluate((element) => {
    element.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        pointerType: 'mouse',
        isPrimary: true,
        button: 0,
        buttons: 1
      })
    );
  });
  await page.waitForTimeout(1400);
  await holdButton.evaluate((element) => {
    element.dispatchEvent(
      new PointerEvent('pointerup', {
        bubbles: true,
        pointerType: 'mouse',
        isPrimary: true,
        button: 0,
        buttons: 0
      })
    );
  });

  await page.getByRole('button', { name: 'Masuk' }).waitFor();
};

const getBloomCount = async (page: Page) => {
  const counter = page.getByText('Blooms').locator('..');
  const countText = await counter.locator('span').nth(1).innerText();
  const parsed = Number.parseInt(countText, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const closeMilestoneIfPresent = async (page: Page) => {
  const milestoneHint = page.getByText('Ketuk untuk lanjut');
  if (await milestoneHint.isVisible()) {
    const closeButton = page.getByRole('button', { name: 'Tutup' }).first();
    await closeButton.evaluate((element) => element.click());
    await milestoneHint.waitFor({ state: 'hidden' });
  }
};

const plantBloomsUntil = async (page: Page, target: number) => {
  const garden = page.getByRole('main', { name: 'Taman bunga interaktif' });
  let count = await getBloomCount(page);
  let attempts = 0;

  while (count < target && attempts < target * 4) {
    await garden.click({
      position: { x: 120 + (attempts % 10) * 12, y: 240 + (attempts % 6) * 10 },
      force: true
    });
    await page.waitForTimeout(40);
    await closeMilestoneIfPresent(page);
    count = await getBloomCount(page);
    attempts += 1;
  }

  await closeMilestoneIfPresent(page);
  expect(count).toBeGreaterThanOrEqual(target);
};

test('robots headers and meta tags are present', async ({ page }) => {
  const response = await page.request.get('/');
  expect(response.headers()['x-robots-tag']).toBe('noindex, nofollow, noimageindex');

  await page.goto('/');
  const robotsMeta = page.locator('meta[name="robots"]');
  await expect(robotsMeta).toHaveAttribute('content', /noindex/i);
  const googlebotMeta = page.locator('meta[name="googlebot"]');
  await expect(googlebotMeta).toHaveAttribute('content', /noimageindex/i);
});

test('full garden journey works end-to-end', async ({ page }) => {
  await completePreIntroGate(page);
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page.getByText(/Sebuah doa yang/i)).toBeVisible();

  await plantBloomsUntil(page, 50);

  const openLetter = page.getByRole('button', { name: /Buka surat ulang tahun/i });
  await expect(openLetter).toBeVisible();
  await openLetter.click();

  const letterHeading = page.getByText(/Untuk Sella/i);
  await letterHeading.waitFor();
  await page.waitForTimeout(1600);
  const closeLetterButton = page.getByRole('button', { name: 'Tutup' }).first();
  await closeLetterButton.evaluate((element) => element.click());
  await expect(letterHeading).toBeHidden();

  const wishDialog = page.getByRole('dialog', { name: /Tuliskan satu doa/i });
  await expect(wishDialog).toBeVisible();
  await page.getByPlaceholder('Tulis harapanmu di sini...').fill('Semoga hari ini penuh bahagia.');
  const sendWishButton = page.getByRole('button', { name: /Kirim ke Langit/i });
  await expect(sendWishButton).toBeEnabled();
  await sendWishButton.evaluate((element) => element.click());

  const wishStored = await page.evaluate(() => window.localStorage.getItem('garden_wish_v1'));
  expect(wishStored).toContain('Semoga hari ini penuh bahagia.');

  const finaleDialog = page.getByRole('dialog', { name: /Mau ditutup dengan apa/i });
  await expect(finaleDialog).toBeVisible();
  await page.getByRole('button', { name: 'Bintang' }).click();
  await expect(finaleDialog).toBeHidden();

  await page.getByRole('button', { name: 'Canvas' }).click();
  const canvas = page.locator('canvas.touch-none');
  await expect(canvas).toBeVisible();
  await canvas.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const pointerId = 1;
    const startX = rect.left + rect.width * 0.3;
    const startY = rect.top + rect.height * 0.4;
    const endX = rect.left + rect.width * 0.6;
    const endY = rect.top + rect.height * 0.55;
    const baseEvent = {
      bubbles: true,
      pointerType: 'mouse',
      isPrimary: true,
      button: 0,
      pointerId
    };

    element.dispatchEvent(
      new PointerEvent('pointerdown', {
        ...baseEvent,
        buttons: 1,
        clientX: startX,
        clientY: startY
      })
    );
    element.dispatchEvent(
      new PointerEvent('pointermove', {
        ...baseEvent,
        buttons: 1,
        clientX: endX,
        clientY: endY
      })
    );
    element.dispatchEvent(
      new PointerEvent('pointerup', {
        ...baseEvent,
        buttons: 0,
        clientX: endX,
        clientY: endY
      })
    );
  });

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Simpan PNG' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('.png');

  await page.getByRole('button', { name: 'Tutup' }).click();
  const canvasStored = await page.evaluate(() => window.localStorage.getItem('garden_canvas_v1'));
  expect(canvasStored).toMatch(/^data:image\//);

  await page.getByRole('button', { name: 'Canvas' }).click();
  await expect(page.locator('canvas.touch-none')).toBeVisible();
});
