import { Router } from "express"
import { create, show, remove } from "./ConnectionsController"

const router = Router()

router.post("/connections", create)
router.get("/connections/:id", show)
router.delete("/connections/:id", remove)

export default router
