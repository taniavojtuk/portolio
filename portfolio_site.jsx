import React, { useMemo, useRef, useState, useEffect } from "react";
import { Sparkles, Send, Instagram, Mail, Menu, X, ArrowUpRight, ArrowRight } from "lucide-react";
import "./portfolio_site.css";
import "./works-grid.css";

/* ------------------------------------------------------------------ *
 *  СТРУКТУРА ПАПОК (створи саме так):
 *
 *  src/video/парфуми/file1.mp4
 *  src/video/прикраси/file2.mp4
 *  src/video/косметика/file3.mp4
 *
 *  src/photo/парфуми/file1.jpg
 *  src/photo/прикраси/file2.png
 *
 *  Назва підпапки = назва категорії, яка автоматично стане кнопкою.
 *  Кидаєш файл у папку — він сам з'являється на сайті, нічого
 *  прописувати вручну не треба.
 * ------------------------------------------------------------------ */

const videoModules = import.meta.glob("/src/video/*/*.{mp4,webm,mov}", {
    eager: true,
    as: "url",
});
const photoModules = import.meta.glob("/src/photo/*/*.{jpg,jpeg,png,webp}", {
    eager: true,
    as: "url",
});

// (опційно) якщо хочеш перезаписати заголовок/клієнта для конкретного файлу —
// впиши сюди за іменем файлу без розширення. Якщо запису немає — береться ім'я файлу.
const WORKS_META = {
    // "file1": { title: "Флакон парфумів — весняна лінійка", client: "Beauty бренд" },
};

/* ------------------------------------------------------------------ *
 *  Блок "Як це виглядає": рівно 3 позиції, файли обов'язково
 *  називай obj1, obj2, obj3 (розширення будь-яке — фото чи відео).
 *
 *  src/process/obj1.mp4
 *  src/process/obj2.jpg
 *  src/process/obj3.mp4
 * ------------------------------------------------------------------ */
const PROCESS_SLOTS = ["obj1", "obj2", "obj3"];
const VIDEO_EXT = ["mp4", "webm", "mov"];

const processModules = import.meta.glob("/src/object/*.{mp4,webm,mov,jpg,jpeg,png,webp}", {
    eager: true,
    as: "url",
});

function buildProcessItems() {
    const byName = {};
    Object.entries(processModules).forEach(([path, url]) => {
        const fileWithExt = path.split("/").pop();
        const fileName = fileWithExt.replace(/\.[^/.]+$/, "");
        const ext = fileWithExt.split(".").pop().toLowerCase();
        byName[fileName] = { fileName, url, isVideo: VIDEO_EXT.includes(ext) };
    });
    // Завжди повертаємо рівно 3 слоти (obj1..obj3), навіть якщо якийсь файл ще не додано
    return PROCESS_SLOTS.map((slot) => byName[slot] || null);
}

function useProcessItems() {
    return useMemo(() => buildProcessItems(), []);
}

function capitalize(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function parseModulePath(path) {
    // приклад: /src/video/парфуми/file1.mp4
    const parts = path.split("/");
    const fileWithExt = parts.pop();
    const category = parts.pop();
    const fileName = fileWithExt.replace(/\.[^/.]+$/, "");
    return { category, fileName };
}

function buildWorks(modules, type) {
    return Object.entries(modules).map(([path, url], index) => {
        const { category, fileName } = parseModulePath(path);
        const meta = WORKS_META[fileName] || {};
        return {
            id: `${type}-${index}-${fileName}`,
            type, // "video" | "photo"
            category, // назва підпапки
            title: meta.title || fileName,
            client: meta.client || "—",
            src: url,
            seed: String(index + 1).padStart(6, "0"),
        };
    });
}

function useMediaWorks() {
    return useMemo(() => {
        const videos = buildWorks(videoModules, "video");
        const photos = buildWorks(photoModules, "photo");
        return [...videos, ...photos];
    }, []);
}

function useSeedTicker() {
    const [seed, setSeed] = useState(48213);
    useEffect(() => {
        const id = setInterval(() => {
            setSeed((prev) => (prev + Math.floor(Math.random() * 37) + 1) % 999999);
        }, 350);
        return () => clearInterval(id);
    }, []);
    return String(seed).padStart(6, "0");
}

function FrameCorners() {
    return (
        <>
            <div className="corner-frame" style={{ top: 0, left: 0 }} />
            <div className="corner-frame" style={{ top: 0, right: 0, transform: "rotate(90deg)" }} />
            <div className="corner-frame" style={{ bottom: 0, right: 0, transform: "rotate(180deg)" }} />
            <div className="corner-frame" style={{ bottom: 0, left: 0, transform: "rotate(270deg)" }} />
        </>
    );
}

/* Контейнер (.work-image-container) задає пропорцію 9:16 і ховає все зайве,
   а сам thumb просто заповнює контейнер на 100% — так надійніше, ніж
   ставити aspect-ratio окремо на <video>/<img>, бо не залежить від того,
   чи є в CSS-файлі власні розміри для .work-thumb. */
const CONTAINER_STYLE = {
    position: "relative",
    width: "100%",
    aspectRatio: "9 / 16",
    overflow: "hidden",
};
const THUMB_STYLE = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
};

// Використовується в розділі "Роботи": грає при наведенні, інакше завмирає на першому кадрі
function VideoThumb({ src }) {
    const ref = useRef(null);

    // Ставимо крихітний зсув, щоб браузер намалював перший кадр
    // (при currentTime === 0 деякі браузери показують чорний кадр).
    const freezeOnFirstFrame = () => {
        if (ref.current) ref.current.currentTime = 0.01;
    };

    return (
        <video
            ref={ref}
            className="work-thumb"
            style={THUMB_STYLE}
            src={src}
            muted
            loop
            playsInline
            preload="metadata"
            onLoadedMetadata={freezeOnFirstFrame}
            onMouseEnter={(e) => e.currentTarget.play()}
            onMouseLeave={(e) => {
                e.currentTarget.pause();
                e.currentTarget.currentTime = 0.01;
            }}
        />
    );
}

// Використовується лише в розділі "Як це виглядає": грає завжди, без наведення
function ProcessVideoThumb({ src }) {
    return (
        <video
            className="work-thumb"
            style={THUMB_STYLE}
            src={src}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
        />
    );
}

function PhotoThumb({ src, alt }) {
    return <img className="work-thumb" style={THUMB_STYLE} src={src} alt={alt} loading="lazy" />;
}

function WorkCard({ w }) {
    return (
        <div className="work-card">
            <div className="work-image-container" style={CONTAINER_STYLE}>
                {w.type === "video" ? (
                    <VideoThumb src={w.src} />
                ) : (
                    <PhotoThumb src={w.src} alt={w.title} />
                )}
                <div className="work-overlay">
                    <ArrowUpRight color="#C15D12" size={20} />
                </div>
            </div>
            <div className="work-info">
                <div className="work-category">{capitalize(w.category)}</div>
                {w.client && w.client !== "—" && (
                    <div className="work-client">{w.client}</div>
                )}
            </div>
        </div>
    );
}

function ProcessCard({ item, index }) {
    if (!item) {
        return (
            <div className="process-card">
                <Sparkles size={22} color="#75726A" />
            </div>
        );
    }
    return (
        <div className="process-card" style={CONTAINER_STYLE}>
            {item.isVideo ? (
                <ProcessVideoThumb src={item.url} />
            ) : (
                <PhotoThumb src={item.url} alt={item.fileName} />
            )}
        </div>
    );
}

function WorksGrid({ filteredWorks }) {
    return (
        <div className="works-grid">
            {filteredWorks.map((w) => (
                <WorkCard key={w.id} w={w} />
            ))}
        </div>
    );
}

const MEDIA_TABS = [
    { key: "all", label: "Все" },
    { key: "photo", label: "Фото" },
    { key: "video", label: "Відео" },
];

export default function PortfolioSite() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [mediaTab, setMediaTab] = useState("all"); // all | photo | video
    const [categoryTab, setCategoryTab] = useState("all"); // "all" або назва підпапки
    const [form, setForm] = useState({ name: "", contact: "", message: "" });
    const [errors, setErrors] = useState({});
    const [sent, setSent] = useState(false);
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState(false);
    const seed = useSeedTicker();

    const works = useMediaWorks();
    const processItems = useProcessItems();

    // Категорії (підпапки) рахуються окремо для фото і для відео,
    // тому кнопки під-навігації показують лише те, що реально є в цій папці.
    const categoriesForTab = useMemo(() => {
        if (mediaTab === "all") return [];
        const set = new Set(
            works.filter((w) => w.type === mediaTab).map((w) => w.category)
        );
        return Array.from(set);
    }, [works, mediaTab]);

    const handleMediaTabChange = (key) => {
        setMediaTab(key);
        setCategoryTab("all"); // скидаємо підкатегорію при зміні верхньої вкладки
    };

    const filteredWorks = useMemo(() => {
        return works.filter((w) => {
            if (mediaTab !== "all" && w.type !== mediaTab) return false;
            if (mediaTab !== "all" && categoryTab !== "all" && w.category !== categoryTab) return false;
            return true;
        });
    }, [works, mediaTab, categoryTab]);

    const navLinks = [
        { label: "Приклад", href: "#process" },
        { label: "Роботи", href: "#works" },
        { label: "Про мене", href: "#about" },
        { label: "Контакти", href: "#contact" },
    ];

    /* Токен і chat_id беруться зі змінних оточення (файл .env, префікс VITE_
       обов'язковий для Vite). */
    const TG_BOT_TOKEN = import.meta.env.VITE_TG_BOT_TOKEN;
    const TG_CHAT_ID = import.meta.env.VITE_TG_CHAT_ID;

    const sendToTelegram = async ({ name, contact, message }) => {
        const text =
            `📩 Нова заявка з сайту\n\n` +
            `Ім'я: ${name}\n` +
            `Контакт: ${contact}\n` +
            `Задача: ${message}`;

        const url = `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`;
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: TG_CHAT_ID, text }),
        });

        if (!res.ok) {
            throw new Error("Telegram API error");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!form.name.trim()) newErrors.name = "Вкажи ім'я";
        if (!form.contact.trim()) newErrors.contact = "Вкажи контакт (телеграм, пошта, телефон)";
        if (!form.message.trim()) newErrors.message = "Коротко опиши задачу";
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        setSending(true);
        setSendError(false);
        try {
            await sendToTelegram(form);
            setSent(true);
            setForm({ name: "", contact: "", message: "" });
        } catch (err) {
            setSendError(true);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="portfolio-wrapper">
            {/* NAV */}
            <nav className="navbar">
                <div className="navbar-container">
                    <div className="display-font logo">
                        AI<span>/</span>ADS
                    </div>
                    <div className="nav-links-desktop hidden md:flex">
                        {navLinks.map((l) => (
                            <a key={l.href} href={l.href} className="nav-link">
                                {l.label}
                            </a>
                        ))}
                    </div>
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="menu-button md:hidden"
                        aria-label="Меню"
                    >
                        {menuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
                {menuOpen && (
                    <div className="mobile-menu md:hidden">
                        {navLinks.map((l) => (
                            <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="nav-link">
                                {l.label}
                            </a>
                        ))}
                    </div>
                )}
            </nav>

            {/* HERO */}
            <header className="hero-section">
                <div className="hero-box">
                    <FrameCorners />
                    <div className="mono-font hero-meta">
                        <span>GENERATING</span>
                        <span className="hero-meta-dim">AI-ВІЗУАЛИ ДЛЯ РЕКЛАМИ</span>
                    </div>
                    <h1 className="display-font hero-title">
                        Рекламні візуали,<br />
                        які <span>генерує</span> ШІ.
                    </h1>
                    <p className="hero-description">
                        Створюю фото та відео для реклами твого бізнесу за допомогою нейромереж — швидше й дешевше за
                        класичну зйомку, з кількома варіантами на вибір під кожен запит.
                    </p>
                    <div className="hero-actions">
                        <a href="#works" className="btn-primary">
                            Дивитись роботи <ArrowRight size={16} />
                        </a>
                        <a href="#contact" className="btn-secondary">
                            Написати мені
                        </a>
                    </div>
                </div>
            </header>

            {/* PROCESS */}
            <section id="process" className="process-section">
                <div className="section-header">
                    <Sparkles size={18} color="#C15D12" />
                    <h2 className="display-font section-subtitle">Як це виглядає</h2>
                </div>
                <p className="mono-font process-prompt">
                    промпт: "рекламний візуал золотого браслету" →
                </p>
                <div className="process-grid">
                    {processItems.map((item, i) => (
                        <ProcessCard key={PROCESS_SLOTS[i]} item={item} index={i} />
                    ))}
                </div>
            </section>

            {/* WORKS */}
            <section id="works" className="works-section">
                <div className="works-controls">
                    <h2 className="display-font section-subtitle">Роботи</h2>

                    {/* Верхня навігація: Все / Фото / Відео */}
                    <div className="filter-group">
                        {MEDIA_TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => handleMediaTabChange(tab.key)}
                                className={`filter-btn ${mediaTab === tab.key ? "active" : ""}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Підкатегорії з'являються тільки коли обрано Фото або Відео,
                        і показують лише ті папки, які реально існують для цього типу */}
                    {mediaTab !== "all" && categoriesForTab.length > 0 && (
                        <div className="filter-group filter-group-sub">
                            <button
                                onClick={() => setCategoryTab("all")}
                                className={`filter-btn ${categoryTab === "all" ? "active" : ""}`}
                            >
                                Всі
                            </button>
                            {categoriesForTab.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setCategoryTab(cat)}
                                    className={`filter-btn ${categoryTab === cat ? "active" : ""}`}
                                >
                                    {capitalize(cat)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {filteredWorks.length > 0 ? (
                    <WorksGrid filteredWorks={filteredWorks} />
                ) : (
                    <p className="section-note">
                        Тут поки що нічого немає. Додай файли у відповідну папку — src/video/&lt;категорія&gt;/ або
                        src/photo/&lt;категорія&gt;/.
                    </p>
                )}
            </section>

            {/* ABOUT */}
            <section id="about" className="about-section">
                <div className="about-content">
                    <div>
                        <h2 className="display-font about-title">Про мене</h2>
                        <p className="about-text">
                            Створюю рекламні зображення та відео для Вашого бізнесу за допомогою нейромереж — без витрат
                            на студію, фотографа й реквізит. Від ідеї та промпту до фінальної обробки й адаптації под
                            потрібний формат — соцмережі, сайт чи каталог.
                        </p>
                    </div>
                    <div>
                        <div className="mono-font about-services-title">Що роблю</div>
                        <div className="services-list">
                            {[
                                "Генерація зображень та відео за промптом",
                                "Кілька варіантів на вибір під один запит",
                                "Ретуш і фінальна обробка",
                                "Адаптація під формати соцмереж і сайту"
                            ].map((s) => (
                                <div key={s} className="service-item">
                                    <span className="service-dot" />
                                    {s}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CONTACT */}
            <section id="contact" className="contact-section">
                <h2 className="display-font contact-title">Зв'язатись</h2>
                <div className="contact-grid">
                    <form onSubmit={handleSubmit} className="contact-form">
                        {sent && (
                            <div className="success-alert">
                                Дякую! Повідомлення надіслано, скоро відповім.
                            </div>
                        )}
                        {sendError && (
                            <div className="error-alert">
                                Не вдалося надіслати. Спробуй ще раз або напиши напряму в соцмережах нижче.
                            </div>
                        )}
                        <div>
                            <input
                                type="text"
                                placeholder="Ім'я"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className={`input-field ${errors.name ? "input-error" : ""}`}
                            />
                            {errors.name && <div className="error-text">{errors.name}</div>}
                        </div>
                        <div>
                            <input
                                type="text"
                                placeholder="Телеграм, пошта чи телефон"
                                value={form.contact}
                                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                                className={`input-field ${errors.contact ? "input-error" : ""}`}
                            />
                            {errors.contact && <div className="error-text">{errors.contact}</div>}
                        </div>
                        <div>
                            <textarea
                                placeholder="Коротко опиши задачу — який візуал потрібен і для чого"
                                rows={4}
                                value={form.message}
                                onChange={(e) => setForm({ ...form, message: e.target.value })}
                                className={`input-field ${errors.message ? "input-error" : ""}`}
                                style={{ resize: "vertical" }}
                            />
                            {errors.message && <div className="error-text">{errors.message}</div>}
                        </div>
                        <button type="submit" className="submit-btn" disabled={sending}>
                            {sending ? "Надсилаю..." : "Надіслати"}
                        </button>
                    </form>

                    <div className="social-links">
                        {[
                            {
                                icon: Instagram,
                                label: "Instagram",
                                value: "ai.content_creatorka",
                                href: "https://instagram.com/ai.content_creatorka",
                            },
                            {
                                icon: Send,
                                label: "Telegram",
                                value: "vojtuktania",
                                href: "https://t.me/vojtuktania",
                            },
                            {
                                icon: Mail,
                                label: "Email",
                                value: "ai.creatorkaa@gmail.com",
                                href: "mailto:ai.creatorkaa@gmail.com",
                            },
                        ].map((c) => (
                            <a key={c.label} href={c.href} className="social-item" target="_blank" rel="noopener noreferrer">
                                <c.icon size={20} color="#C15D12" />
                                <div>
                                    <div className="social-label">{c.label}</div>
                                    <div className="social-value">{c.value}</div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="main-footer">
                <span className="mono-font">© 2026 — AI/ADS. Portfolio mockup.</span>
            </footer>
        </div>
    );
}