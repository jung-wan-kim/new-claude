import * as blessed from 'blessed';

export type NotificationType = 'success' | 'warning' | 'error' | 'info';

interface Notification {
  id: string;
  element: blessed.Widgets.BoxElement;
  timeout?: NodeJS.Timeout;
}

export class NotificationManager {
  private notifications: Map<string, Notification> = new Map();
  private maxNotifications: number = 3;
  private nextId: number = 1;

  showNotification(
    parent: blessed.Widgets.Screen,
    message: string,
    type: NotificationType = 'info',
    duration: number = 3000
  ): string {
    // 최대 알림 수 초과 시 가장 오래된 것 제거
    if (this.notifications.size >= this.maxNotifications) {
      const oldestId = Array.from(this.notifications.keys())[0];
      this.removeNotification(oldestId);
    }

    const id = `notification-${this.nextId++}`;
    const colors = this.getColors(type);
    const icon = this.getIcon(type);

    const notification = blessed.box({
      parent,
      content: ` ${icon} ${message} `,
      top: 2 + (this.notifications.size * 4),
      right: 2,
      width: 'shrink',
      height: 3,
      align: 'center',
      valign: 'middle',
      style: colors,
      border: { type: 'line' },
      shadow: true,
      tags: true
    });

    const notificationObj: Notification = {
      id,
      element: notification
    };

    if (duration > 0) {
      notificationObj.timeout = setTimeout(() => {
        this.removeNotification(id);
      }, duration);
    }

    this.notifications.set(id, notificationObj);
    this.animateIn(notification);
    parent.render();

    return id;
  }

  removeNotification(id: string) {
    const notification = this.notifications.get(id);
    if (!notification) return;

    if (notification.timeout) {
      clearTimeout(notification.timeout);
    }

    this.animateOut(notification.element, () => {
      notification.element.destroy();
      this.notifications.delete(id);
      this.repositionNotifications();
      notification.element.screen.render();
    });
  }

  clearAll() {
    this.notifications.forEach((_, id) => {
      this.removeNotification(id);
    });
  }

  private getColors(type: NotificationType) {
    const colorMap = {
      success: { bg: 'green', fg: 'white' },
      warning: { bg: 'yellow', fg: 'black' },
      error: { bg: 'red', fg: 'white' },
      info: { bg: 'blue', fg: 'white' }
    };
    return colorMap[type];
  }

  private getIcon(type: NotificationType): string {
    const iconMap = {
      success: '✓',
      warning: '⚠',
      error: '✗',
      info: 'ℹ'
    };
    return iconMap[type];
  }

  private animateIn(element: blessed.Widgets.BoxElement) {
    const originalRight = element.right || 2;
    element.right = -50;
    
    let position = -50;
    const interval = setInterval(() => {
      position += 10;
      element.right = Math.min(position, originalRight as number);
      element.screen.render();
      
      if (position >= (originalRight as number)) {
        clearInterval(interval);
      }
    }, 20);
  }

  private animateOut(element: blessed.Widgets.BoxElement, callback: () => void) {
    let opacity = 100;
    const interval = setInterval(() => {
      opacity -= 10;
      
      if (opacity <= 0) {
        clearInterval(interval);
        callback();
      } else {
        // Blessed doesn't support opacity, so we simulate with content fading
        element.style.bg = element.style.bg;
        element.screen.render();
      }
    }, 30);
  }

  private repositionNotifications() {
    let index = 0;
    this.notifications.forEach(notification => {
      notification.element.top = 2 + (index * 4);
      index++;
    });
  }
}