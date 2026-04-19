'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export type Language = 'en' | 'ar'

const translations: Record<Language, Record<string, string>> = {
  en: {
    dashboard:        'Dashboard',
    machines:         'Machines',
    issues:           'Issues',
    myIssues:         'My Issues',
    myWorkOrders:     'My Work Orders',
    spareParts:       'Spare Parts',
    reports:          'Reports',
    operators:        'Operators',
    auditLog:         'Audit Log',
    logout:           'Logout',
    logIssue:         'Log Issue',
    settings:         'Settings',
    settingsDesc:     'Appearance and language preferences',
    theme:            'Theme',
    light:            'Light',
    dark:             'Dark',
    language:         'Language',
    supervisor:       'Supervisor',
    operator:         'Operator',
    technician:       'Technician',
    open:             'Open',
    inProgress:       'In Progress',
    resolved:         'Resolved',
    breakdown:        'Breakdown',
    minor:            'Minor Issue',
    preventive:       'Preventive',
    category:         'Category',
    resolution:       'Resolution',
    assign:           'Assign',
    resolve:          'Resolve',
    cancel:           'Cancel',
    confirm:          'Confirm',
    maintenanceTracker: 'Maintenance Tracker',
    // Page headings
    issuesTitle:      'Issues',
    machinesTitle:    'Machines',
    reportsTitle:     'Reports',
    sparesTitle:      'Spare Parts',
    operatorsTitle:   'Operators',
    auditTitle:       'Audit Log',
    dashboardTitle:   'Dashboard',
    // v2 — new keys
    unit:             'Unit',
    unitCostKWD:      'Unit Cost (KWD)',
    inStock:          'In Stock',
    lowStock:         'Low Stock',
    critical:         'Critical',
    outOfStock:       'Out of Stock',
    stockStatus:      'Stock Status',
    stockCategory:    'Stock Category',
    description:      'Description',
    duplicateCode:    'Duplicate Code',
    inactive:         'Inactive',
    accountInactive:  'Account inactive. Please contact your supervisor.',
    searchParts:      'Search parts...',
    allCategories:    'All Categories',
    allStatuses:      'All Statuses',
    showing:          'Showing',
    of:               'of',
    page:             'Page',
    parts:            'parts',
    totalValue:       'Total Value',
    topConsumed:      'Top Consumed Parts',
    partsUsage:       'Parts Usage',
    lowStockAlerts:   'Low Stock Alerts',
    viewLowStock:     'View low stock',
    kwdCurrency:      'KWD',
    perUnit:          'per unit',
  },
  ar: {
    dashboard:        'لوحة التحكم',
    machines:         'الآلات',
    issues:           'البلاغات',
    myIssues:         'بلاغاتي',
    myWorkOrders:     'أوامر عملي',
    spareParts:       'قطع الغيار',
    reports:          'التقارير',
    operators:        'المشغّلون',
    auditLog:         'سجل المراجعة',
    logout:           'تسجيل الخروج',
    logIssue:         'تسجيل بلاغ',
    settings:         'الإعدادات',
    settingsDesc:     'إعدادات المظهر واللغة',
    theme:            'المظهر',
    light:            'فاتح',
    dark:             'داكن',
    language:         'اللغة',
    supervisor:       'مشرف',
    operator:         'مشغّل',
    technician:       'فني',
    open:             'مفتوح',
    inProgress:       'قيد التنفيذ',
    resolved:         'محلول',
    breakdown:        'عطل كامل',
    minor:            'عطل بسيط',
    preventive:       'صيانة وقائية',
    category:         'الفئة',
    resolution:       'الحل',
    assign:           'تعيين',
    resolve:          'إغلاق',
    cancel:           'إلغاء',
    confirm:          'تأكيد',
    maintenanceTracker: 'نظام متابعة الصيانة',
    // Page headings
    issuesTitle:      'البلاغات',
    machinesTitle:    'الآلات',
    reportsTitle:     'التقارير',
    sparesTitle:      'قطع الغيار',
    operatorsTitle:   'المشغّلون',
    auditTitle:       'سجل المراجعة',
    dashboardTitle:   'لوحة التحكم',
    // v2 — new keys
    unit:             'الوحدة',
    unitCostKWD:      'تكلفة الوحدة (د.ك)',
    inStock:          'متوفر',
    lowStock:         'مخزون منخفض',
    critical:         'حرج',
    outOfStock:       'نفد المخزون',
    stockStatus:      'حالة المخزون',
    stockCategory:    'فئة المخزون',
    description:      'الوصف',
    duplicateCode:    'رمز مكرر',
    inactive:         'غير نشط',
    accountInactive:  'الحساب غير نشط. يرجى التواصل مع المشرف.',
    searchParts:      'البحث عن قطع...',
    allCategories:    'جميع الفئات',
    allStatuses:      'جميع الحالات',
    showing:          'عرض',
    of:               'من',
    page:             'صفحة',
    parts:            'قطع',
    totalValue:       'القيمة الإجمالية',
    topConsumed:      'أكثر القطع استخداماً',
    partsUsage:       'استخدام القطع',
    lowStockAlerts:   'تنبيهات المخزون المنخفض',
    viewLowStock:     'عرض المخزون المنخفض',
    kwdCurrency:      'د.ك',
    perUnit:          'للوحدة',
  },
}

interface LanguageContextType {
  lang: Language
  setLang: (l: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('en')

  useEffect(() => {
    const stored = localStorage.getItem('alarabi_lang') as Language | null
    if (stored === 'en' || stored === 'ar') {
      setLangState(stored)
      document.documentElement.setAttribute('dir', stored === 'ar' ? 'rtl' : 'ltr')
      document.documentElement.setAttribute('lang', stored)
    }
  }, [])

  const setLang = (l: Language) => {
    setLangState(l)
    localStorage.setItem('alarabi_lang', l)
    document.documentElement.setAttribute('dir', l === 'ar' ? 'rtl' : 'ltr')
    document.documentElement.setAttribute('lang', l)
  }

  const t = (key: string): string =>
    translations[lang][key] ?? translations['en'][key] ?? key

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
