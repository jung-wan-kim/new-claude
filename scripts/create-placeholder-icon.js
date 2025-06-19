// 플레이스홀더 아이콘 생성 (Node.js Canvas 사용)
const fs = require('fs');
const path = require('path');

// SVG로 아이콘 생성
const svgIcon = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <!-- 배경 원 -->
  <circle cx="512" cy="512" r="480" fill="#007acc"/>
  
  <!-- CCC 텍스트 -->
  <text x="512" y="512" 
        font-family="SF Mono, Monaco, monospace" 
        font-size="300" 
        font-weight="bold"
        fill="white" 
        text-anchor="middle" 
        dominant-baseline="central">
    CCC
  </text>
  
  <!-- 터미널 프롬프트 스타일 장식 -->
  <text x="200" y="700" 
        font-family="SF Mono, Monaco, monospace" 
        font-size="80" 
        fill="white" 
        opacity="0.8">
    &gt;_
  </text>
</svg>
`;

// assets 디렉토리 생성
const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// SVG 파일 저장
fs.writeFileSync(path.join(assetsDir, 'icon.svg'), svgIcon);

// 간단한 PNG 아이콘도 생성 (Base64 인코딩)
const pngBase64 = `iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAGqElEQVR4nO2ae2wUVRTGv3Nn9tHdbrctLaVAS2lLKRQQEHkJiAiIgICACCqPIEYRQRRRMRoVTYyJiQZN1Bg1ahQVBUQQEFBAQHkJyLsttPShQKEPuu1udzs7c43TpYXu7s7sTrfbEvdPJrszd+49v3PvOeeee4cQJEqUKFGiRPnfQ5hMZnP37g5CSDqAVAAJACK1Km5QVSm7srLi5N69exdzzmv8dU9CDbdYLKapU6ffD2AigC6Nvd55vlBV9WuhUHjlhx82v3/06OECrdcLEoCUlJRnASwEEKf1Wh1wzrny/fffLd6yZfNqQO1VMBMUAGPGjL3/wYdmvgmgW6AdevBKSkrOPvPMouTS0tKf6hMFBUBBQcF3LMbcF0ByoB168PLy8kZ1G5a5b1DhCcgk6HQ6pgJIdOcdO3YIo8eOwu6dPwIAVq1ah0OHT8Fut7ssRymNa9Om3U4p/BoA9Np9fAKQkpJCAST66nT5ipU4e+6Sx10aEWHB3n17MGnydMhOZ/3b0VQKh7sLTrGPrwreCOvEJj2aNG0Kk9Gq91oKgAU6B/D1d1/qurgoLQVzZ88GACjBrgNQo9sAYLfbvwTwupbrBMJQOGwmXZJOCCEJCQm67O3oJqQvgHZCUQDgJQB79PYWG5uE1q3a6LFBYpOT9JjdxU2AlJSUJKFQKF2ycuWqICx7fRo1LgApUADWLllyQvfAKKW67Gw2q14b2eeTYDQaU3XpGQAyMjN1Xcd5xQIgBQoAALi2JNaMvtOm4cPV7yMrO9uttZkzZ4Ybm2KkRqPRl8Ev4uPbIDa2ia5rVRUIehP7ewYANAAIhEJRQCklVVXlO7Zt205nzZiBOXNn49SpkwAAm82GMWPGoG/fvli4cCGUSgVUhb8GoMbhcDgdDkdVeXn55YCNU0rNpaVliU1btGgOzlsAqAEg13tRAAKCAJiNAmgDFhJvNlssFvQd0A9TpkzBggUL8OWXX+KVl5chKysL586dw/Hjx3G+5DqIQPkrW7e+W1xc/GhGRkYagKBNdYRSc79+A2IByNj3w/eo+0AAeEgAgNFgMAQ8v3PO4XA4sHfvXmzZsgW33XYb5s+fj7FjxyI3NxfDhw8HANBsW//YpqbEtNi6dZsrr79+1gkgaKs3ANhs8XEAiLrRD4Hws3AKQJOwtMY5B6UUH3zwAVatWoXhw4dj7ty5SE9Pd/kqCkdFlcKBmQlGg3HckiVLPfq7uroau3fvBuccU6dO9ds3pVRSFMUtJBKSJN01CQBIJBO8vvHKioryAwA88qAAmZCQgOXLl2P16tU4fvw4VqxYgZqaGvzxxx+oqlGgjGjVzJqYOEpnqMAnn3yCvXv3YtKkScjJydFl7weAa12kSBQ7NG7cOAFAHQBCW7Rshfj4eJ8GfAAoKipCWlqaR6bW1NTUK7m5uQ8AmEXUKHvU9lGlM2bMwGOPPYbvvvsO//zzD9avXw8AGDVqFCZOnIjMzExdzyGKol+HQjgBsFqtzYnSsLcAvj6xvJMjEj8AFBcXe52KCSEET3U6P2zbNvvJb775Zm1t7W0N1x0VhXOAMTFv3jzk5+fj0KFDSEzUtxQUBLGJj7vkQIJBALBarc0beh4BAGNsOYAzHi90Op0AoCvflCSJMZm9m5qauqxv3759Yjzdu3r1aty6dQsAMGbMGMyZMweZmZm6+xEEoWmTxCaHLl68dN0tAAQgJTm5dXJycgqABvGdnCehvCzQLGkzgCme6p1OpwTAqgtACJGUSvmfhISEtyZNmjS48TCAsrIyOBwO3eObTCb0GzTgKmPsGTCm3twWA3A5UBCEFZwrv3sqNxiN/QD4TWrNZnNMQkLCXgABAaCq6ltXr175xpVYpaXhySefDMiGEOJwOOxLOOcleAAAqcViqZg4cfLjAF7xVJ/bJW8BgOGBzIV2u33QlStXCux2+3IAbSmlx8vLy88G5L1Gk5qaeoJzjjPn8tE2LR1dOndqsA2T01k9EkCh5y4oXQrgOwAIeFusKnQqgEv1fwjALl68mF9YWPgMV1XIsvzsxYsXzwdkVIMQcvTo0cdVp/NDMGb2pA4AxlhcZk73QQB6NlZ/Xm9qLGJjYw8DGB1Q6waGMbZ3cJ8hzwLoV1fnCaLQ5M4ZkyeP79yx0/xr167lh7tPD3j2IEsJWrVqtVKW5b8AjAu3fTDhKNy8af2wd9/7YD2Ahm/gBolQgO7de2wEcCTctoGgOhxVD0+c/OBPZ88WDAZQHioDHxn9bQLqjjXrOHBjfXWuKP+R+LO3tChRokSJEiVKA/IvjOXQdNhEyh8AAAAASUVORK5CYII=`;

// PNG 파일 저장
const pngBuffer = Buffer.from(pngBase64, 'base64');
fs.writeFileSync(path.join(assetsDir, 'icon.png'), pngBuffer);
fs.writeFileSync(path.join(assetsDir, 'tray-icon.png'), pngBuffer);

console.log('✅ Placeholder icons created successfully!');
console.log('📁 Icons saved in:', assetsDir);