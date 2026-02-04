// DashMark Service Worker
// 策略：Network First（网络优先），优先从网络获取最新内容，离线时使用缓存

const CACHE_NAME = 'dashmark-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html'
];

// 安装 Service Worker - 预缓存核心文件
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );

  // 立即激活新的 Service Worker
  self.skipWaiting();
});

// 激活 Service Worker - 清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // 删除旧版本的缓存
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // 立即控制所有客户端
  return self.clients.claim();
});

// 拦截网络请求 - Network First 策略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 只处理同源请求
  if (url.origin !== self.location.origin) {
    return;
  }

  // Network First 策略：
  // 1. 优先从网络获取
  // 2. 网络成功则返回新内容并更新缓存
  // 3. 网络失败则从缓存返回
  event.respondWith(
    fetch(request)
      .then((response) => {
        // 检查响应是否有效
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // 克隆响应，因为响应流只能使用一次
        const responseToCache = response.clone();

        // 更新缓存
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        // 网络失败，尝试从缓存获取
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // 如果是导航请求，返回离线页面
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }

          // 其他资源返回空响应
          return new Response('离线模式下无缓存内容', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          });
        });
      })
  );
});

// 监听消息事件（用于手动更新缓存等操作）
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});
