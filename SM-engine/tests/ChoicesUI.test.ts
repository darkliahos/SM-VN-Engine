import { describe, it, expect } from 'vitest';
import { GameConfig } from '../src/renderer/GameConfig';

describe('Choices UI Configuration', () => {
  it('should have choiceBackdrop configured with translucent alpha', () => {
    const { choiceBackdrop } = GameConfig.UI;
    expect(choiceBackdrop).toBeDefined();
    expect(choiceBackdrop.enabled).toBe(true);
    expect(choiceBackdrop.backgroundColor).toBeDefined();
    expect(choiceBackdrop.backgroundAlpha).toBeGreaterThan(0);
    expect(choiceBackdrop.backgroundAlpha).toBeLessThan(1);
  });

  it('should have choicePanel configured as a translucent card with border and shadow', () => {
    const { choicePanel } = GameConfig.UI;
    expect(choicePanel).toBeDefined();
    expect(choicePanel.enabled).toBe(true);
    expect(choicePanel.minWidth).toBeGreaterThanOrEqual(500);
    expect(choicePanel.paddingX).toBeGreaterThan(0);
    expect(choicePanel.paddingTop).toBeGreaterThan(0);
    expect(choicePanel.paddingBottom).toBeGreaterThan(0);
    expect(choicePanel.borderRadius).toBeGreaterThan(0);
    expect(choicePanel.backgroundColor).toBeDefined();
    expect(choicePanel.backgroundAlpha).toBeGreaterThan(0);
    expect(choicePanel.backgroundAlpha).toBeLessThan(1);
    expect(choicePanel.borderWidth).toBeGreaterThan(0);
    expect(choicePanel.borderColor).toBeDefined();
    expect(choicePanel.borderAlpha).toBeGreaterThan(0);
    expect(choicePanel.shadowColor).toBeDefined();
    expect(choicePanel.shadowAlpha).toBeGreaterThan(0);
    expect(choicePanel.showDivider).toBe(true);
  });

  it('should have choiceButton dimensions accommodating choices text', () => {
    const { choiceButton } = GameConfig.UI;
    expect(choiceButton).toBeDefined();
    expect(choiceButton.width).toBeGreaterThanOrEqual(400);
    expect(choiceButton.height).toBeGreaterThanOrEqual(40);
    expect(choiceButton.spacing).toBeGreaterThan(choiceButton.height);
    expect(choiceButton.borderRadius).toBeGreaterThan(0);
    expect(choiceButton.alpha).toBeGreaterThan(0);
    expect(choiceButton.alpha).toBeLessThanOrEqual(1);
  });

  it('should have choiceFadeDuration configured for sleek animations', () => {
    const { Animation } = GameConfig;
    expect(Animation.choiceFadeDuration).toBeDefined();
    expect(Animation.choiceFadeDuration).toBeGreaterThan(0);
  });
});
