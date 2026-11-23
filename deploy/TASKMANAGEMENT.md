# استقرار زیر مسیر /ATS در کنار TaskManagement

این روش فایل Compose فعلی را تغییر نمی‌دهد. فایل `taskmanagement.compose.yaml` یک سرویس ATS به همان پروژه و شبکه `application` اضافه می‌کند؛ برای همه دستورات بعدی Compose هر دو فایل را مشخص کنید.

## ساخت و انتقال ایمیج

در پوشه پروژه روی دستگاه ساخت:

```powershell
docker build --platform linux/amd64 --build-arg NEXT_PUBLIC_BASE_PATH=/ATS -t golpakhsh-ats:ats-path .
docker save -o golpakhsh-ats-ats-path.tar golpakhsh-ats:ats-path
```

ایمیج، فایل `taskmanagement.compose.yaml` و قطعه `nginx-ats.conf` را به سرور انتقال دهید. ایمیج قبلی که بدون build argument ساخته شده است برای زیرمسیر مناسب نیست.

## راه‌اندازی روی سرور

در `/opt/taskmanagment`، فایل Compose تکمیلی را با نام `docker-compose.ats.yml` قرار دهید و در فایل `.env` موجود، یک خط `ATS_ADMIN_PASSWORD` با رمز قوی و متفاوت اضافه کنید. مقادیر موجود فایل را حفظ کنید. سپس:

```bash
docker load -i golpakhsh-ats-ats-path.tar
docker compose -f docker-compose.yml -f docker-compose.ats.yml config --quiet
docker compose -f docker-compose.yml -f docker-compose.ats.yml up -d --no-deps ats
docker compose -f docker-compose.yml -f docker-compose.ats.yml ps
```

پایگاه داده در volume مستقل `ats_data` نگهداری می‌شود. داده‌های سامانه فعلی و پایگاه داده آن تغییر نمی‌کنند. ایمیج حاوی رزومه‌ها و پایگاه داده قبلی نیست؛ برای انتقال اطلاعات موجود دستورهای مربوط به SQLite در README اصلی را با volume جدید تطبیق دهید و پیش از جایگزینی از داده‌ها نسخه پشتیبان بگیرید.

## تنظیم Nginx موجود

از `tls/nginx.conf` نسخه پشتیبان بگیرید. محتوای `nginx-ats.conf` را **داخل بلوک server مربوط به HTTPS دامنه tms.fanava.com** اضافه کنید؛ کل فایل Nginx را با این قطعه جایگزین نکنید و تنظیمات فعلی برنامه و TLS را حفظ کنید. سرویس ATS باید پیش از بررسی Nginx اجرا شده باشد تا نام `ats` قابل شناسایی باشد.

سپس تنظیمات را بررسی و فقط در صورت موفقیت reload کنید:

```bash
docker compose -f docker-compose.yml -f docker-compose.ats.yml exec frontend nginx -t
docker compose -f docker-compose.yml -f docker-compose.ats.yml exec frontend nginx -s reload
```

سامانه در `https://tms.fanava.com/ATS/` و پنل مدیریت در `https://tms.fanava.com/ATS/admin` قرار می‌گیرد. در صورت وجود locationهای متداخل یا ساختار متفاوت Nginx، ابتدا پیکربندی فعلی را بررسی کنید. از حذف volumes خودداری کنید.
