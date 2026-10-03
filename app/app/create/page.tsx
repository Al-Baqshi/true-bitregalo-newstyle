import { redirect } from "next/navigation"

/**
 * Retired. Everything a person can start now lives on the network home and in the New menu,
 * so old links to /app/create land there. /app/create/token stays.
 */
export default function Create() {
  redirect("/app")
}
