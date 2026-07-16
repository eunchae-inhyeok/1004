const eventDate = new Date("2026-10-04T12:30:00+09:00");
const toast = document.getElementById("toast");
const mapUrl = "https://map.kakao.com/link/to/아펠가모공덕,37.543450,126.950664";
const messageStorageKey = "wedding-nice-messages";
const kakaoJavaScriptKey = "64a830cb58e8b40ed6f25fe6f4a3e78f";
const publicShareUrl = "https://eunchae-inhyeok.github.io/1004/";
const mobileUserAgent = /Android|iPhone|iPad|iPod/i;
const supabaseSettings = window.WEDDING_SUPABASE || {};
const databaseClient = supabaseSettings.url && supabaseSettings.anonKey && window.supabase
    ? window.supabase.createClient(supabaseSettings.url, supabaseSettings.anonKey)
    : null;

function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2000);
}

function pad(value) {
    return String(value).padStart(2, "0");
}

function updateCountdown() {
    const diff = Math.max(0, eventDate.getTime() - Date.now());
    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    document.getElementById("countdown-days").textContent = pad(days);
    document.getElementById("countdown-hours").textContent = pad(hours);
    document.getElementById("countdown-minutes").textContent = pad(minutes);
    document.getElementById("countdown-seconds").textContent = pad(seconds);
    document.getElementById("countdown-days-text").textContent = String(days);
}

function renderCalendar() {
    const grid = document.getElementById("calendar-grid");
    if (!grid) return;

    const firstDay = new Date(2026, 9, 1).getDay();
    const cells = Array.from({ length: firstDay }, () => '<span class="calendar-cell empty"></span>');
    for (let day = 1; day <= 31; day += 1) {
        const classes = ["calendar-cell"];
        if (day % 7 === 0) classes.push("sun");
        if (day === 4) classes.push("active");
        cells.push(`<span class="${classes.join(" ")}">${day}</span>`);
    }
    grid.innerHTML = cells.join("");
}

function initializeMap() {
    const container = document.getElementById("map-view");
    if (!container || !window.kakao?.maps) return;

    window.kakao.maps.load(() => {
        const position = new window.kakao.maps.LatLng(37.543450, 126.950664);
        const map = new window.kakao.maps.Map(container, {
            center: position,
            level: 4
        });
        const marker = new window.kakao.maps.Marker({ position });
        marker.setMap(map);
        const infoWindow = new window.kakao.maps.InfoWindow({
            content: '<div style="padding:8px 12px;font:13px Noto Sans KR,sans-serif;color:#182235;white-space:nowrap">아펠가모 공덕 라로브홀</div>'
        });
        infoWindow.open(map, marker);
        container.classList.add("map-loaded");
    });
}

async function copyText(text) {
    if (navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch { }
    }

    const field = document.createElement("textarea");
    field.value = text;
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    let copied = false;
    try {
        copied = document.execCommand("copy");
    } catch { copied = false; }
    field.remove();
    return copied;
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    modal.querySelector("input, textarea, [data-close-modal]")?.focus();
}

function closeModal(modal) {
    modal.hidden = true;
    if (!document.querySelector(".modal-backdrop:not([hidden])")) document.body.classList.remove("modal-open");
}

function openMapLink(event) {
    const link = event.currentTarget;
    if (!mobileUserAgent.test(navigator.userAgent) || !link.dataset.appUrl) return;

    event.preventDefault();
    const webUrl = link.href || mapUrl;
    let switchedToApp = false;
    const onVisibilityChange = () => {
        switchedToApp = document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.location.href = link.dataset.appUrl;
    window.setTimeout(() => {
        document.removeEventListener("visibilitychange", onVisibilityChange);
        if (!switchedToApp) window.location.href = webUrl;
    }, 900);
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[char]));
}

function formatMessageDate(value) {
    return new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function initializeRevealAnimations() {
    const sections = document.querySelectorAll(".invitation-card > .panel");
    sections.forEach((section, index) => {
        section.classList.add("reveal");
        if (index % 3 === 1) section.classList.add("reveal-delay-1");
        if (index % 3 === 2) section.classList.add("reveal-delay-2");
    });

    if (!("IntersectionObserver" in window)) {
        sections.forEach((section) => section.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver((entries, currentObserver) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            currentObserver.unobserve(entry.target);
        });
    }, { threshold: 0.08, rootMargin: "0px 0px -8%" });

    sections.forEach((section) => observer.observe(section));
}

function initializeGallery() {
    const track = document.getElementById("gallery-track");
    const lightbox = document.getElementById("gallery-lightbox");
    const lightboxImage = document.getElementById("gallery-lightbox-image");
    const lightboxClose = document.getElementById("gallery-lightbox-close");
    const lightboxPrevious = document.getElementById("gallery-lightbox-prev");
    const lightboxNext = document.getElementById("gallery-lightbox-next");
    if (!track) return;

    const total = track.children.length;
    let lightboxCurrent = 0;
    let lightboxStartX = 0;
    const closeLightbox = () => {
        if (!lightbox) return;
        lightbox.hidden = true;
        if (!document.querySelector(".modal-backdrop:not([hidden])")) document.body.classList.remove("modal-open");
    };

    const renderLightbox = () => {
        const image = track.children[lightboxCurrent];
        if (!image || !lightboxImage) return;
        lightboxImage.src = image.currentSrc || image.src;
        lightboxImage.alt = image.alt;
    };

    const moveLightbox = (offset) => {
        lightboxCurrent = (lightboxCurrent + offset + total) % total;
        renderLightbox();
    };

    const openLightbox = (image) => {
        if (!lightbox || !lightboxImage) return;
        lightboxCurrent = Math.max(0, Array.from(track.children).indexOf(image));
        renderLightbox();
        lightbox.hidden = false;
        document.body.classList.add("modal-open");
        lightboxClose?.focus();
    };

    const compareGrid = document.getElementById("gallery-grid-compare");
    if (compareGrid) {
        const comparePrevious = document.getElementById("gallery-compare-prev");
        const compareNext = document.getElementById("gallery-compare-next");
        const compareDots = document.getElementById("gallery-compare-dots");
        const pageSize = 4;
        let comparePage = 0;
        let compareDragStartX = 0;
        let compareDragging = false;
        let compareMoved = false;
        const renderCompareGrid = () => {
            const start = comparePage * pageSize;
            compareGrid.innerHTML = Array.from(track.children).slice(start, start + pageSize).map((image, offset) => {
                const index = start + offset;
                return `<img src="${escapeHtml(image.currentSrc || image.src)}" alt="${escapeHtml(image.alt)}" data-grid-index="${index}">`;
            }).join("");
            comparePrevious.disabled = comparePage === 0;
            compareNext.disabled = start + pageSize >= total;
            const pageCount = Math.ceil(total / pageSize);
            compareDots.innerHTML = Array.from({ length: pageCount }, (_, index) => `<button class="gallery-grid-dot${index === comparePage ? " is-active" : ""}" type="button" aria-label="${index + 1}번째 페이지"></button>`).join("");
            compareDots.querySelectorAll(".gallery-grid-dot").forEach((dot, index) => dot.addEventListener("click", () => { comparePage = index; renderCompareGrid(); }));
        };
        compareGrid.addEventListener("click", (event) => {
            if (compareMoved) {
                compareMoved = false;
                event.preventDefault();
                return;
            }
            const image = event.target.closest("img[data-grid-index]");
            if (image) openLightbox(track.children[Number(image.dataset.gridIndex)]);
        });
        compareGrid.addEventListener("pointerdown", (event) => {
            if (event.button !== 0) return;
            compareDragging = true;
            compareMoved = false;
            compareDragStartX = event.clientX;
            compareGrid.setPointerCapture?.(event.pointerId);
            compareGrid.classList.add("is-dragging");
        });
        compareGrid.addEventListener("pointermove", (event) => {
            if (!compareDragging) return;
            if (Math.abs(event.clientX - compareDragStartX) > 8) {
                compareMoved = true;
                event.preventDefault();
            }
        });
        const finishCompareDrag = (event) => {
            if (!compareDragging) return;
            compareDragging = false;
            compareGrid.classList.remove("is-dragging");
            const distance = event.clientX - compareDragStartX;
            if (Math.abs(distance) > 48) {
                const pageCount = Math.ceil(total / pageSize);
                comparePage = Math.max(0, Math.min(pageCount - 1, comparePage + (distance < 0 ? 1 : -1)));
                renderCompareGrid();
            }
        };
        compareGrid.addEventListener("pointerup", finishCompareDrag);
        compareGrid.addEventListener("pointercancel", finishCompareDrag);
        comparePrevious?.addEventListener("click", () => { comparePage -= 1; renderCompareGrid(); });
        compareNext?.addEventListener("click", () => { comparePage += 1; renderCompareGrid(); });
        renderCompareGrid();
    }

    lightboxClose?.addEventListener("click", closeLightbox);
    lightboxPrevious?.addEventListener("click", () => moveLightbox(-1));
    lightboxNext?.addEventListener("click", () => moveLightbox(1));
    lightbox?.addEventListener("click", (event) => {
        if (event.target === lightbox) closeLightbox();
    });
    lightbox?.addEventListener("pointerdown", (event) => {
        if (event.target === lightboxImage) lightboxStartX = event.clientX;
    });
    lightbox?.addEventListener("pointerup", (event) => {
        if (event.target !== lightboxImage) return;
        const distance = event.clientX - lightboxStartX;
        if (Math.abs(distance) > 50) moveLightbox(distance < 0 ? 1 : -1);
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && lightbox && !lightbox.hidden) closeLightbox();
        if (event.key === "ArrowLeft" && lightbox && !lightbox.hidden) moveLightbox(-1);
        if (event.key === "ArrowRight" && lightbox && !lightbox.hidden) moveLightbox(1);
    });

}

function readLocalMessages() {
    try {
        return JSON.parse(localStorage.getItem(messageStorageKey) || "[]");
    } catch {
        return [];
    }
}

function saveLocalMessages(messages) {
    localStorage.setItem(messageStorageKey, JSON.stringify(messages));
}

function messageMarkup(item, removable) {
    const close = removable ? '<button class="message-close" type="button" data-remove-message aria-label="삭제">×</button>' : "";
    return `<article class="message-card" data-message-id="${escapeHtml(item.id)}">${close}<p>${escapeHtml(item.message)}</p><div class="message-meta"><span>From</span> ${escapeHtml(item.name)} <time>${escapeHtml(item.date)}</time></div></article>`;
}

const messagePageSize = 4;
let messageItems = [];
let messagePage = 0;
let messagesRemovable = false;

function renderMessages() {
    const list = document.querySelector(".message-list");
    const pagination = document.getElementById("message-pagination");
    const previous = document.getElementById("message-prev");
    const next = document.getElementById("message-next");
    const dots = document.getElementById("message-dots");
    if (!list) return;

    const pageCount = Math.max(1, Math.ceil(messageItems.length / messagePageSize));
    messagePage = Math.min(messagePage, pageCount - 1);
    const start = messagePage * messagePageSize;
    list.innerHTML = messageItems
        .slice(start, start + messagePageSize)
        .map((item) => messageMarkup(item, messagesRemovable))
        .join("");

    if (!pagination || !previous || !next || !dots) return;
    pagination.hidden = messageItems.length <= messagePageSize;
    previous.disabled = messagePage === 0;
    next.disabled = messagePage >= pageCount - 1;
    dots.innerHTML = Array.from({ length: pageCount }, (_, index) => `<button class="gallery-grid-dot message-page-dot${index === messagePage ? " is-active" : ""}" type="button" aria-label="${index + 1}번째 방명록 페이지"></button>`).join("");
    dots.querySelectorAll(".gallery-grid-dot").forEach((dot, index) => {
        dot.addEventListener("click", () => {
            messagePage = index;
            renderMessages();
        });
    });
}

function initializeMessagePagination() {
    document.getElementById("message-prev")?.addEventListener("click", () => {
        messagePage -= 1;
        renderMessages();
    });
    document.getElementById("message-next")?.addEventListener("click", () => {
        messagePage += 1;
        renderMessages();
    });
}

async function loadMessages() {
    const list = document.querySelector(".message-list");
    if (!list) return;

    if (databaseClient) {
        const { data, error } = await databaseClient
            .from("messages")
            .select("id, name, message, created_at")
            .order("created_at", { ascending: false })
            .limit(50);

        if (!error) {
            messageItems = data.map((item) => ({
                id: item.id,
                name: item.name,
                message: item.message,
                date: formatMessageDate(item.created_at)
            }));
            messagesRemovable = false;
            messagePage = 0;
            renderMessages();
            return;
        }

        showToast("방명록을 불러오지 못했습니다.");
        return;
    }

    messageItems = readLocalMessages();
    messagesRemovable = true;
    messagePage = 0;
    renderMessages();
}

async function createMessage(name, message) {
    if (databaseClient) {
        const { data, error } = await databaseClient
            .from("messages")
            .insert({ name, message })
            .select("id, name, message, created_at")
            .single();

        if (error) return { error };
        return {
            item: { id: data.id, name: data.name, message: data.message, date: formatMessageDate(data.created_at) },
            remote: true
        };
    }

    const item = { id: crypto.randomUUID?.() || String(Date.now()), name, message, date: formatMessageDate(new Date()) };
    saveLocalMessages([item, ...readLocalMessages()].slice(0, 20));
    return { item, remote: false };
}

document.addEventListener("DOMContentLoaded", () => {
    renderCalendar();
    updateCountdown();
    initializeMap();
    initializeRevealAnimations();
    initializeGallery();
    initializeMessagePagination();
    window.setInterval(updateCountdown, 1000);
    loadMessages();

    document.querySelectorAll("[data-copy]").forEach((button) => {
        button.addEventListener("click", async () => {
            const copied = await copyText(button.dataset.copy);
            showToast(copied ? "계좌번호가 복사되었습니다." : "복사에 실패했습니다.");
        });
    });

    document.getElementById("btn-contact")?.addEventListener("click", () => openModal("contact-modal"));
    document.getElementById("btn-message")?.addEventListener("click", () => openModal("message-modal"));
    document.getElementById("map-click")?.addEventListener("click", (event) => {
        if (mobileUserAgent.test(navigator.userAgent)) {
            openMapLink(event);
            return;
        }
        window.open(mapUrl, "_blank", "noopener,noreferrer");
    });
    document.querySelectorAll(".map-action").forEach((link) => link.addEventListener("click", openMapLink));

    document.querySelectorAll("[data-close-modal]").forEach((button) => {
        button.addEventListener("click", () => closeModal(button.closest(".modal-backdrop")));
    });
    document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
        backdrop.addEventListener("click", (event) => {
            if (event.target === backdrop) closeModal(backdrop);
        });
    });

    document.getElementById("message-form")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        const name = String(data.get("name")).trim();
        const message = String(data.get("message")).trim();
        const result = await createMessage(name, message);

        if (result.error) {
            showToast("메시지 등록에 실패했습니다.");
            return;
        }

        messageItems = [result.item, ...messageItems];
        messagesRemovable = !result.remote;
        messagePage = 0;
        renderMessages();
        form.reset();
        closeModal(document.getElementById("message-modal"));
        showToast("메시지가 등록되었습니다.");
    });

    document.addEventListener("click", (event) => {
        const removeButton = event.target.closest("[data-remove-message]");
        if (!removeButton) return;
        const card = removeButton.closest("[data-message-id]");
        messageItems = messageItems.filter((item) => item.id !== card.dataset.messageId);
        saveLocalMessages(messageItems);
        renderMessages();
        showToast("메시지를 삭제했습니다.");
    });

    document.getElementById("share-link")?.addEventListener("click", async () => {
        const copied = await copyText(window.location.href);
        showToast(copied ? "청첩장 주소를 복사했습니다." : "복사에 실패했습니다.");
    });

    document.getElementById("share-kakao")?.addEventListener("click", async () => {
        if (window.Kakao && window.location.protocol === "https:") {
            try {
                if (!window.Kakao.isInitialized()) window.Kakao.init(kakaoJavaScriptKey);
                window.Kakao.Share.sendScrap({
                    requestUrl: publicShareUrl,
                    templateId: undefined
                });
                return;
            } catch { }
        }

        if (navigator.share) {
            const shareData = { title: "강인혁 · 홍은채 결혼식", text: "결혼식에 초대합니다.", url: publicShareUrl };
            try {
                await navigator.share(shareData);
                return;
            } catch (error) {
                if (error.name === "AbortError") return;
            }
        }
        const copied = await copyText(window.location.href);
        showToast(copied ? "주소를 복사했습니다. 카카오톡에 붙여넣어 공유해 주세요." : "공유에 실패했습니다.");
    });
});
