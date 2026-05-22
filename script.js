// ==========================================
// CONTENTFUL CONFIG
// ==========================================
const SPACE_ID     = "0fo9oivnc9eg";
const ACCESS_TOKEN = "eyIZSbaPdv4n-Lc80i7L7gJWVVDHfMa8Vj5-HL_b-hI";
const BASE_URL     = `https://cdn.contentful.com/spaces/${SPACE_ID}/environments/master`;
const FALLBACK_IMG = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop";

// ==========================================
// BOOT
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    const posts = await fetchAllPosts();

    if (posts === null) {
        // Network / API error
        showIndexError("Couldn't reach the archive. Please check your connection and refresh.");
        return;
    }

    if (posts.length === 0) {
        showIndexError("No spotlights published yet — check back soon.");
        return;
    }

    renderHero(posts);
    renderRecentPosts(posts);
});

// ==========================================
// FETCH ALL POSTS
// ==========================================
async function fetchAllPosts() {
    const url = `${BASE_URL}/entries?access_token=${ACCESS_TOKEN}&content_type=post&order=-sys.createdAt&include=1`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return parsePosts(data);
    } catch (err) {
        console.error("fetchAllPosts failed:", err);
        return null;
    }
}

// ==========================================
// PARSE CONTENTFUL RESPONSE → CLEAN OBJECTS
// ==========================================
function parsePosts(data) {
    if (!data.items?.length) return [];

    // Build asset ID → CDN URL map
    const imageMap = {};
    (data.includes?.Asset ?? []).forEach(asset => {
        if (asset.sys?.id && asset.fields?.file?.url) {
            imageMap[asset.sys.id] = "https:" + asset.fields.file.url;
        }
    });

    return data.items.map(item => {
        const f       = item.fields;
        const imageId = f.image?.sys?.id ?? null;
        return {
            title:        f.title        ?? "Untitled",
            excerpt:      f.excerpt      ?? "",
            slug:         f.slug         ?? item.sys.id,
            body:         f.body         ?? "",
            imageUrl:     imageId ? imageMap[imageId] : FALLBACK_IMG,
            spotifyEmbed: f.spotifyEmbed ?? null,
        };
    });
}

// ==========================================
// RENDER HERO
// ==========================================
function renderHero(posts) {
    const hero = posts[0];

    const heroImg = document.getElementById("hero-img");
    if (heroImg) {
        heroImg.style.backgroundImage = `url('${hero.imageUrl}')`;
    }

    const heroTitle = document.getElementById("hero-title");
    if (heroTitle) heroTitle.textContent = hero.title;

    const heroExcerpt = document.getElementById("hero-excerpt");
    if (heroExcerpt) heroExcerpt.textContent = hero.excerpt;

    const heroBtn = document.getElementById("hero-btn");
    if (heroBtn) {
        heroBtn.addEventListener("click", () => goToPost(hero.slug));
    }
}

// ==========================================
// RENDER RECENT POSTS GRID
// ==========================================
function renderRecentPosts(posts) {
    const container = document.getElementById("posts-container");
    if (!container) return;

    const recent = posts.slice(1);

    if (recent.length === 0) {
        container.innerHTML = `<p class="loading-state">More spotlights coming soon.</p>`;
        return;
    }

    container.innerHTML = recent.map(post => `
        <article class="post-card fade-up" data-slug="${escAttr(post.slug)}" role="link" tabindex="0"
                 aria-label="Read spotlight: ${escAttr(post.title)}">
            <div class="post-thumb" style="background-image: url('${post.imageUrl}')"></div>
            <div>
                <h3 class="post-card-title">${escHtml(post.title)}</h3>
                <p class="post-card-excerpt">${escHtml(post.excerpt)}</p>
                <p class="post-meta">Spotlight &nbsp;·&nbsp; Read More →</p>
            </div>
        </article>
    `).join("");

    // Single delegated listener — no inline onclick, no globals
    container.addEventListener("click", e => {
        const card = e.target.closest(".post-card[data-slug]");
        if (card) goToPost(card.dataset.slug);
    });

    // Keyboard accessibility
    container.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            const card = e.target.closest(".post-card[data-slug]");
            if (card) goToPost(card.dataset.slug);
        }
    });
}

// ==========================================
// ROUTING — slug in URL query param, no localStorage
// ==========================================
function goToPost(slug) {
    window.location.href = `post.html?slug=${encodeURIComponent(slug)}`;
}

// ==========================================
// ERROR STATE
// ==========================================
function showIndexError(message) {
    const heroTitle   = document.getElementById("hero-title");
    const heroExcerpt = document.getElementById("hero-excerpt");
    const heroBtn     = document.getElementById("hero-btn");
    const container   = document.getElementById("posts-container");

    if (heroTitle)   heroTitle.textContent   = "Something went wrong.";
    if (heroExcerpt) heroExcerpt.textContent = message;
    if (heroBtn)     heroBtn.style.display   = "none";
    if (container)   container.innerHTML     = `<p class="loading-state">${escHtml(message)}</p>`;
}

// ==========================================
// UTILS
// ==========================================
function escHtml(str) {
    const d = document.createElement("div");
    d.appendChild(document.createTextNode(String(str)));
    return d.innerHTML;
}

function escAttr(str) {
    return String(str).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
