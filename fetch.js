// fetch-projects.js
const apiUrl = "http://localhost/portfolioAdmin/v1/api/fetch-project.php";
const imgBaseUrl = "http://localhost/portfolioAdmin/uploaded_img/";

/**
 * Normalize a tech field into an array of tag strings.
 * Accepts: null/undefined, array, comma-separated string, single string.
 */
function normalizeTechField(field) {
  if (!field) return [];
  if (Array.isArray(field)) return field.filter(Boolean).map(String);
  // If string, split on commas and slashes, or return as a single trimmed token
  return String(field)
    .split(/[,/|]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

function createTechTag(name) {
  const span = document.createElement("span");
  span.className = "tech-tag";
  span.textContent = name;
  return span;
}

function safeExternalLink(href) {
  // return null for empty or placeholder hrefs
  if (!href || href === "#" || href.trim() === "") return null;
  // Prevent javascript: or data: schemes
  const lowered = href.trim().toLowerCase();
  if (lowered.startsWith("javascript:") || lowered.startsWith("data:")) return null;
  return href;
}

async function fetchProjects() {
  try {
    const response = await fetch(apiUrl, { credentials: "omit" });
    if (!response.ok) throw new Error(`Failed to fetch projects (status ${response.status})`);

    const data = await response.json();

    // Support two possible shapes:
    // 1) { status: "success", data: [...] }
    // 2) [...]  (direct array)
    const projects = Array.isArray(data) ? data : (data.data || []);
    const container = document.getElementById("projects-container");
    if (!container) {
      console.error("No element with id 'projects-container' found.");
      return;
    }

    container.innerHTML = ""; // Clear existing content

    if (!projects.length) {
      const empty = document.createElement("p");
      empty.className = "no-projects";
      empty.textContent = "No projects to display.";
      container.appendChild(empty);
      return;
    }

    projects.forEach(project => {
      // Create main card div
      const card = document.createElement("div");
      card.className = "project-card";

      // Image section
      const imgDiv = document.createElement("div");
      imgDiv.className = "project-image";

      if (project.image) {
        const img = document.createElement("img");
        img.src = imgBaseUrl + project.image;
        img.alt = project.name ? project.name + " screenshot" : "Project image";
        // keep styling via your CSS; don't add Tailwind or extra classes
        imgDiv.appendChild(img);
      } else {
        const placeholder = document.createElement("div");
        placeholder.className = "image-placeholder";
        placeholder.innerHTML = `<i class="fas fa-shopping-cart" aria-hidden="true"></i>`;
        imgDiv.appendChild(placeholder);
      }

      // Overlay with links (only include links that are valid)
      const overlay = document.createElement("div");
      overlay.className = "project-overlay";

      const links = document.createElement("div");
      links.className = "project-links";

      const liveHref = safeExternalLink(project.websiteUrl || project.liveUrl || project.url);
      const githubHref = safeExternalLink(project.github || project.repo || project.githubUrl);

      if (liveHref) {
        const liveLink = document.createElement("a");
        liveLink.href = liveHref;
        liveLink.target = "_blank";
        liveLink.rel = "noopener noreferrer";
        liveLink.className = "project-link";
        liveLink.setAttribute("aria-label", `Open ${project.name || "project"} live site`);
        liveLink.innerHTML = `<i class="fas fa-external-link-alt" aria-hidden="true"></i>`;
        links.appendChild(liveLink);
      }

      if (githubHref) {
        const githubLink = document.createElement("a");
        githubLink.href = githubHref;
        githubLink.target = "_blank";
        githubLink.rel = "noopener noreferrer";
        githubLink.className = "project-link";
        githubLink.setAttribute("aria-label", `Open ${project.name || "project"} GitHub repo`);
        githubLink.innerHTML = `<i class="fab fa-github" aria-hidden="true"></i>`;
        links.appendChild(githubLink);
      }

      // Only append links wrapper if any links exist to keep markup clean
      if (links.children.length) {
        overlay.appendChild(links);
        imgDiv.appendChild(overlay);
      }

      // Content section
      const contentDiv = document.createElement("div");
      contentDiv.className = "project-content";

      const title = document.createElement("h3");
      title.textContent = project.name || "Untitled Project";

      const desc = document.createElement("p");
      desc.textContent = project.details || project.description || "";

      const techDiv = document.createElement("div");
      techDiv.className = "project-tech";

      // Normalize tech-related fields (handle typos like ddatabase)
      const frontendTags = normalizeTechField(project.frontend || project.front_end || project.frontend_tech);
      const backendTags = normalizeTechField(project.backend || project.back_end || project.backend_tech);
      const databaseTags = normalizeTechField(project.database || project.db || project.ddatabase);

      [...frontendTags, ...backendTags, ...databaseTags].forEach(tag => {
        techDiv.appendChild(createTechTag(tag));
      });

      contentDiv.appendChild(title);
      if (desc.textContent) contentDiv.appendChild(desc);
      if (techDiv.children.length) contentDiv.appendChild(techDiv);

      card.appendChild(imgDiv);
      card.appendChild(contentDiv);

      container.appendChild(card);
    });

  } catch (error) {
    console.error("Error fetching projects:", error);
    // Optionally show a user-visible error inside the container
    const container = document.getElementById("projects-container");
    if (container) {
      container.innerHTML = `<p class="error">Unable to load projects.</p>`;
    }
  }
}

// Fetch projects on DOMContentLoaded so the container exists
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", fetchProjects);
} else {
  fetchProjects();
}


// contact us js

// contact-api.js
// Usage:
// 1) Add <script src="/js/contact-api.js"></script> after your form.
// 2) Optionally set the API endpoint in the form element:
//      <form class="form" data-api-endpoint="https://api.example.com/contact.php" data-api-content-type="json" data-api-credentials="false">...</form>
//    - data-api-content-type: "json" (default) or "form" (application/x-www-form-urlencoded)
//    - data-api-credentials: "true" to send cookies (use only if API supports credentials/CORS)
// 3) Or edit the apiUrl variable below.

