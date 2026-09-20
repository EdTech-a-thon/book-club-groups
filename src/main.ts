import { mount } from "svelte";
import App from "./LocalApp.svelte";
import "./app.css";

const target = document.getElementById("app")!;
mount(App, { target });
