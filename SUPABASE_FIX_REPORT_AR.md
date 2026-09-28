# تقرير إصلاح Supabase — Masarifi 7.2.1

## السبب المؤكد لعدم العمل في 7.2.0
ملف `assets/v8-supabase-auto-config.js` كان مفعلاً على الوضع التلقائي لكن بقيم فارغة:

- `url: ""`
- `key: ""`

لذلك `configured()` كانت ترجع false ولا يبدأ Supabase أصلاً.

## ما تم إصلاحه
- إذا كانت النسخة Auto لكن إعداد المالك غير مثبت، تظهر الآن شاشة إعداد المالك بدل حالة ميتة.
- يسمح لمالك البرنامج بإدخال Project URL وPublishable key في هذه الحالة فقط.
- بعد الحفظ يتم فوراً إنشاء Anonymous session ومحاولة المزامنة، بدون الحاجة لإعادة تشغيل البرنامج.
- إذا كانت القيم مدمجة فعلياً داخل النسخة، يبقى Zero-Setup مغلقاً على المستخدم النهائي ولا تظهر له إعدادات الخادم.
- بقي Local-First وIndexedDB كما هو.
- بقي Revision conflict protection وRLS وStorage وRealtime كما هي.

## مطلوب من مشروع Supabase نفسه
1. تشغيل `supabase/setup.sql` مرة واحدة.
2. تفعيل Anonymous Sign-Ins من Supabase Dashboard.
3. استخدام Project URL الحقيقي.
4. استخدام Publishable key (`sb_publishable_...`) فقط في الواجهة.

## الاختبارات
- Supabase unit/runtime/auto tests: 12/12 passed after the fix.

