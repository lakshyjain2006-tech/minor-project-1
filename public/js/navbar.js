// =============================================
// BLOOD-BRIDGE NAVBAR
// =============================================
// Drop this script into any page and the navbar
// will render itself, highlight the active link,
// and handle the mobile hamburger.
// =============================================

(function () {

    // =========================================
    // NAV ITEMS
    // =========================================

    const navItems = [
        {
            label: "🩸 Register",
            href: "/index.html",
            match: ["/", "/index.html"]
        },
        {
            label: "🚨 Emergency",
            href: "/emergency.html",
            match: ["/emergency.html"],
            className: "bb-emergency-link"
        },
        {
            label: "🏥 Hospital",
            href: "/hospital.html",
            match: ["/hospital.html", "/hospital-document.html"]
        },
        {
            label: "📄 Upload Docs",
            href: "/hospital-document.html",
            match: ["/hospital-document.html"]
        },
        {
            label: "👤 Login",
            href: "/login.html",
            match: ["/login.html"]
        },
        {
            label: "📊 Dashboard",
            href: "/donor-dashboard.html",
            match: ["/donor-dashboard.html"]
        }
    ];

    const adminItem = {
        label: "🔐 Admin",
        href: "/admin-verification.html",
        match: ["/admin-verification.html"],
        className: "bb-admin-link"
    };


    // =========================================
    // ACTIVE PATH
    // =========================================

    const currentPath =
        window.location.pathname;


    function isActive(item) {
        return item.match.some(function (p) {
            return (
                currentPath === p ||
                currentPath.endsWith(p)
            );
        });
    }


    // =========================================
    // BUILD LI
    // =========================================

    function buildLi(item) {
        const li = document.createElement("li");

        if (item.className) {
            li.className = item.className;
        }

        const a = document.createElement("a");
        a.href = item.href;
        a.textContent = item.label;

        if (isActive(item)) {
            a.className = "active";
        }

        li.appendChild(a);
        return li;
    }


    // =========================================
    // BUILD NAVBAR HTML
    // =========================================

    function buildNavbar() {

        // Wrapper
        const nav = document.createElement("nav");
        nav.className = "bb-nav";

        const inner = document.createElement("div");
        inner.className = "bb-nav-inner";

        // Brand
        const brand = document.createElement("a");
        brand.href = "/";
        brand.className = "bb-nav-brand";
        brand.innerHTML = "💧 Blood-<span>Bridge</span>";

        // Hamburger
        const burger = document.createElement("button");
        burger.className = "bb-nav-hamburger";
        burger.setAttribute("aria-label", "Toggle navigation");
        burger.innerHTML =
            "<span></span><span></span><span></span>";

        // Links
        const ul = document.createElement("ul");
        ul.className = "bb-nav-links";

        navItems.forEach(function (item) {
            ul.appendChild(buildLi(item));
        });

        // Divider
        const divider = document.createElement("li");
        divider.className = "bb-nav-divider";
        ul.appendChild(divider);

        // Admin
        ul.appendChild(buildLi(adminItem));

        // Hamburger toggle
        burger.addEventListener("click", function () {
            burger.classList.toggle("open");
            ul.classList.toggle("open");
        });

        // Close menu when a link is clicked (mobile)
        ul.addEventListener("click", function (e) {
            if (e.target.tagName === "A") {
                burger.classList.remove("open");
                ul.classList.remove("open");
            }
        });

        inner.appendChild(brand);
        inner.appendChild(ul);
        inner.appendChild(burger);
        nav.appendChild(inner);

        return nav;
    }


    // =========================================
    // INJECT
    // =========================================

    function injectNavbar() {
        const navbar = buildNavbar();

        // Insert before <body>'s first child
        const body = document.body;

        if (body.firstChild) {
            body.insertBefore(navbar, body.firstChild);
        } else {
            body.appendChild(navbar);
        }
    }


    // =========================================
    // WAIT FOR DOM
    // =========================================

    if (
        document.readyState === "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            injectNavbar
        );
    } else {
        injectNavbar();
    }

})();
