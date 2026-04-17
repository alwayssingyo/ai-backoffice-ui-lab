import {createFileRoute} from "@tanstack/react-router";
import "./index.css";
import {Login} from "@/routes/login.tsx";

export const Route = createFileRoute("/")({component: Login});
