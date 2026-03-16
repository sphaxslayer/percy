<!--
  pages/login.vue — Login page.
  Allows users to sign in with email + password via NextAuth credentials provider.
  Uses the auth layout (centered card).
-->
<script setup lang="ts">
import { ref } from 'vue'

// Use the auth layout (centered card, no sidebar)
definePageMeta({
  layout: 'auth',
})

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

// signIn comes from @sidebase/nuxt-auth — triggers the credentials provider
const { signIn } = useAuth()

async function handleLogin() {
  error.value = ''
  loading.value = true

  try {
    const result = await signIn('credentials', {
      email: email.value,
      password: password.value,
      redirect: false, // We handle redirect manually to catch errors
    })

    if (result?.error) {
      error.value = 'Email ou mot de passe incorrect'
    } else {
      // Successful login — redirect to dashboard
      await navigateTo('/dashboard')
    }
  } catch {
    error.value = 'Une erreur est survenue. Veuillez réessayer.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Connexion</CardTitle>
      <CardDescription>
        Connectez-vous à votre compte Percy
      </CardDescription>
    </CardHeader>

    <CardContent>
      <form class="space-y-4" @submit.prevent="handleLogin">
        <!-- Error message -->
        <div
          v-if="error"
          class="rounded-md bg-red-50 p-3 text-sm text-red-600"
          role="alert"
        >
          {{ error }}
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
            placeholder="••••••••"
            required
            data-testid="password"
          />
        </div>

        <!-- Submit button -->
        <Button
          type="submit"
          class="w-full"
          :disabled="loading"
          data-testid="login-button"
        >
          {{ loading ? 'Connexion...' : 'Se connecter' }}
        </Button>
      </form>
    </CardContent>

    <CardFooter class="justify-center">
      <p class="text-sm text-slate-600">
        Pas encore de compte ?
        <NuxtLink to="/register" class="font-medium text-primary hover:underline">
          Créer un compte
        </NuxtLink>
      </p>
    </CardFooter>
  </Card>
</template>
