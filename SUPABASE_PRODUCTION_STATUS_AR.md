# Masarifi 7.2.2 — Supabase Production

تم إنشاء وربط مشروع Supabase الإنتاجي باسم **Masarifi** داخل منظمة **wowmobilya** في منطقة **eu-central-1 (Frankfurt)**.

## المنفذ على الخادم
- جدول `public.masarifi_cloud` مع RLS لكل مستخدم.
- دالة Compare-And-Swap `masarifi_cloud_push` لمنع الكتابة فوق نسخة أحدث أثناء تعارض أجهزة أوفلاين.
- Supabase Realtime منشور لجدول المزامنة.
- Bucket خاص `masarifi-files` للصور JPEG بحد 3 MB للملف، مع سياسات SELECT/INSERT/UPDATE/DELETE خاصة بالمستخدم.
- Project URL وPublishable key مدمجان في التطبيق؛ لا توجد Secret/service_role keys داخل الواجهة.
- Security Advisor: بدون تحذيرات بعد التجهيز.
- Performance Advisor: بدون تحذيرات بعد التجهيز.

## المنفذ في التطبيق
- Local-First: IndexedDB يبقى مسار الحفظ الأول.
- Zero-Setup للمستخدم النهائي: URL/Key مدمجان ولا تظهر شاشة إعداد عند النسخة الإنتاجية.
- إنشاء هوية Supabase تلقائيًا عند أول اتصال عبر Anonymous Sign-In.
- Realtime + فحص دوري احتياطي للمزامنة.
- Revision conflict guard + نسخ احتياطية قبل اعتماد السحابة أو الجهاز عند التعارض.
- الصور تبقى محلية أوفلاين وتُرفع إلى Private Storage عند الاتصال.
- Supabase JS مثبت على الإصدار 2.117.2 داخل منطق النسخة الإنتاجية.

## إعداد مالك المشروع المتبقي
يجب تفعيل **Anonymous Sign-Ins** مرة واحدة فقط من Supabase Dashboard:
Authentication → Providers / Sign In options → Anonymous Sign-Ins → Enable.
هذا إعداد مالك المشروع فقط؛ المستخدم النهائي لا يقوم بأي خطوة.
