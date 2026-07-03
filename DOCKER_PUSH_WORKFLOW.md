docker compose build backend && docker tag oc-backend yashubob/coderunner-img:latest && docker push yashubob/coderunner-img:latest# Docker Push Workflow for Backend Changes

## Quick Summary
After you make changes to the backend code, follow these steps to update the Docker Hub image:

### Step 1: Rebuild the image
```bash
cd c:\Users\yaswa\OneDrive\Desktop\Dev\OC
docker compose build backend
```

### Step 2: Tag the image with your Docker Hub repo
```bash
docker tag oc-backend yashubob/coderunner-img:latest
```

### Step 3: Push to Docker Hub
```bash
docker push yashubob/coderunner-img:latest
```

### Or combine all steps:
```bash
docker compose build backend && docker tag oc-backend yashubob/coderunner-img:latest && docker push yashubob/coderunner-img:latest
```

---

## Full Workflow Example

### When you modify backend code:
1. Edit files in `backend/`
2. Restart your Docker setup:
   ```bash
   docker compose down
   docker compose up -d redis backend
   ```
3. Test locally to verify changes work
4. When ready to push to Docker Hub:
   ```bash
   docker compose build backend
   docker tag oc-backend yashubob/coderunner-img:latest
   docker push yashubob/coderunner-img:latest
   ```

---

## Frontend Changes
The frontend runs with `npm run dev`, so:
- **No Docker rebuild needed** for development
- Changes appear instantly in your browser
- When ready to deploy, the frontend can be served separately (static build or containerized)

---

## Tags & Versioning (Optional)
If you want to keep version history:

```bash
docker tag oc-backend yashubob/coderunner-img:v1.0
docker push yashubob/coderunner-img:v1.0
docker tag oc-backend yashubob/coderunner-img:latest
docker push yashubob/coderunner-img:latest
```

---

## Common Commands
- View local images: `docker images`
- Check running containers: `docker compose ps`
- View logs: `docker compose logs -f backend`
- Stop everything: `docker compose down`
- Restart: `docker compose up -d`
