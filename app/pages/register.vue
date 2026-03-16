<!--
  pages/register.vue — Registration page.
  Creates a new user account via POST /api/auth/register, then auto-logs in.
  Uses the auth layout (centered card).
-->
<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({
  layout: 'auth',
})

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)

const { signIn } = useAuth()

async function handleRegister() {
  error.value = ''

  // Client-side validation: password confirmation
  if (password.value !== confirmPassword.value) {
    error.value = 'Les mots de passe ne correspondent pas'
    return
  }

  loading.value = true

  try {
    // 1. Create the account via our register API
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value,
        name: name.value || undefined,
      },
    })

    // 2. Auto-login after successful registration
    const result = await signIn('credentials', {
      email: email.value,
      password: password.value,
      redirect: false,
    })

    if (result?.error) {
      error.value = 'Compte créé, mais la connexion automatique a échoué. Veuillez vous connecter.'
    } else {
      await navigateTo('/dashboard')
    }
  } catch (e: unknown) {
    // Extract error message from the API response
    const fetchError = e as { data?: { message?: string } }
    error.value = fetchError?.data?.message || 'Une erreur est survenue. Veuillez réessayer.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Créer un compte</CardTitle>
      <CardDescription>
        Rejoignez Percy pour accéder à vos skills
      </CardDescription>
    </CardHeader>

    <CardContent>
      <form class="space-y-4" @submit.prevent="handleRegister">
        <!-- Error message -->
        <div
          v-if="error"
          class="rounded-md bg-red-50 p-3 text-sm text-red-600"
          role="alert"
        >
          {{ error }}
        </div>

        <!-- Name field (optional) -->
        <div class="space-y-2">
          <label for="name" class="text-sm font-medium text-slate-700">
            Nom <span class="text-slate-400">(optionnel)</span>
          </label>
          <Input
            id="name"
            v-model="name"
            type="text"
            placeholder="Votre nom"
            data-testid="name"
          />
        </div>

        <!-- Email field -->
        <div class="space-y-2">
          <label for="email" class="text-sm font-medium text-slate-700">
            Email
          </label>
          <Input
            id="email"
            v-model="email"
            type="email"
            placeholder="vous@exemple.com"
            required
            data-testid="email"
          />
        </div>

        <!-- Password field -->
        <div class="space-y-2">
          <label for="password" class="text-sm font-medium text-slate-700">
            Mot de passe
          </label>
          <Input
            id="password"
            v-model="password"
            type="password"
            placeholder="Au moins 8 caractères"
            required
            minlength="8"
            data-testid="password"
          />
        </div>

        <!-- Confirm password field -->
        <div class="space-y-2">
          <label for="confirm-password" class="text-sm font-medium text-slate-700">
            Confirmer le mot de passe
          </label>
          <Input
            id="confirm-password"
            v-model="confirmPassword"
            type="password"
            placeholder="Répétez le mot de passe"
            required
            data-testid="confirm-password"
          />
        </div>

        <!-- Submit button -->
        <Button
          type="submit"
          class="w-full"
          :disabled="loading"
          data-testid="register-button"
        >
          {{ loading ? 'Création...' : 'Créer mon compte' }}
        </Button>
      </form>
    </CardContent>

    <CardFooter class="justify-center">
      <p class="text-sm text-slate-600">
        Déjà un compte ?
        <NuxtLink to="/login" class="font-medium text-primary hover:underline">
          Se connecter
        </NuxtLink>
      </p>
    </CardFooter>
  </Card>
</template>
