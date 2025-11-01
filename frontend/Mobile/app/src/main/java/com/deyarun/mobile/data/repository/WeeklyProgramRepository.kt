package com.deyarun.mobile.data.repository

import android.content.Context
import com.deyarun.mobile.data.api.CloudApi
import com.deyarun.mobile.data.model.PlannedWorkout
import com.deyarun.mobile.data.storage.TokenManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject

data class AICoachingResponse(
    val suggestions: List<String>,
    val motivation: String
)

class WeeklyProgramRepository(
    private val context: Context,
    private val cloudApi: CloudApi
) {
    private val tokenManager = TokenManager(context)

    suspend fun getCurrentWeekWorkouts(): List<PlannedWorkout> = withContext(Dispatchers.IO) {
        val token = tokenManager.getToken()
            ?: throw Exception("Nav autentifikācijas tokena")

        val response = cloudApi.getCurrentWeekProgram("Bearer $token")

        if (response.isSuccessful) {
            val body = response.body()
            if (body != null && body.has("workouts")) {
                val workoutsArray = body.getJSONArray("workouts")
                val workouts = mutableListOf<PlannedWorkout>()

                for (i in 0 until workoutsArray.length()) {
                    val workoutJson = workoutsArray.getJSONObject(i)
                    workouts.add(parsePlannedWorkout(workoutJson))
                }

                return@withContext workouts
            } else {
                return@withContext emptyList()
            }
        } else {
            throw Exception("Neizdevās ielādēt programmu: ${response.code()}")
        }
    }

    suspend fun generateWeeklyProgram(): Unit = withContext(Dispatchers.IO) {
        val token = tokenManager.getToken()
            ?: throw Exception("Nav autentifikācijas tokena")

        val requestBody = JSONObject().apply {
            put("userPreferences", JSONObject().apply {
                put("fitnessLevel", "intermediate")
                put("trainingDays", org.json.JSONArray(listOf("monday", "wednesday", "friday", "sunday")))
                put("weeklyDistanceGoal", 25)
                put("language", "lv")
            })
        }

        val response = cloudApi.generateWeeklyProgram("Bearer $token", requestBody)

        if (!response.isSuccessful) {
            throw Exception("Neizdevās ģenerēt programmu: ${response.code()}")
        }
    }

    suspend fun updateWorkoutStatus(workoutId: String, status: String): Unit = withContext(Dispatchers.IO) {
        val token = tokenManager.getToken()
            ?: throw Exception("Nav autentifikācijas tokena")

        val requestBody = JSONObject().apply {
            put("status", status)
            put("completionData", JSONObject().apply {
                put("completionDate", java.util.Date().toString())
                put("effortLevel", 5)
                put("notes", "Pabeigts no mobile aplikācijas")
            })
        }

        val response = cloudApi.updateWorkoutStatus("Bearer $token", workoutId, requestBody)

        if (!response.isSuccessful) {
            throw Exception("Neizdevās atjaunināt statusu: ${response.code()}")
        }
    }

    suspend fun getAICoachingSuggestions(): AICoachingResponse = withContext(Dispatchers.IO) {
        val token = tokenManager.getToken()
            ?: throw Exception("Nav autentifikācijas tokena")

        val requestBody = JSONObject().apply {
            put("userPreferences", JSONObject().apply {
                put("language", "lv")
            })
        }

        val response = cloudApi.getAICoachingSuggestions("Bearer $token", requestBody)

        if (response.isSuccessful) {
            val body = response.body()
            if (body != null) {
                val suggestions = parseStringArray(body.optJSONArray("suggestions"))
                val motivation = body.optString("motivation", "")

                return@withContext AICoachingResponse(
                    suggestions = suggestions,
                    motivation = motivation
                )
            } else {
                throw Exception("Tukša atbilde no servera")
            }
        } else {
            throw Exception("Neizdevās ielādēt AI ieteikumus: ${response.code()}")
        }
    }

    private fun parsePlannedWorkout(json: JSONObject): PlannedWorkout {
        return PlannedWorkout(
            id = json.optString("id", ""),
            scheduledDate = json.optString("scheduledDate", ""),
            dayOfWeek = json.optString("dayOfWeek", ""),
            type = json.optString("type", ""),
            name = json.optString("name", ""),
            description = json.optString("description", ""),
            targetMetrics = parseTargetMetrics(json.optJSONObject("targetMetrics")),
            exercises = if (json.has("exercises")) parseExercises(json.getJSONObject("exercises")) else null,
            warmupInstructions = json.optString("warmupInstructions", ""),
            cooldownInstructions = json.optString("cooldownInstructions", ""),
            coachingTips = parseStringArray(json.optJSONArray("coachingTips")),
            status = json.optString("status", "scheduled"),
            completionMetrics = if (json.has("completionMetrics"))
                parseCompletionMetrics(json.getJSONObject("completionMetrics"))
            else null
        )
    }

    private fun parseTargetMetrics(json: JSONObject?): com.deyarun.mobile.data.model.TargetMetrics {
        return com.deyarun.mobile.data.model.TargetMetrics(
            totalDistance = json?.optInt("totalDistance", 0) ?: 0,
            totalDuration = json?.optInt("totalDuration", 0) ?: 0,
            averagePace = json?.optInt("averagePace", 0) ?: 0,
            heartRateZone = if (json?.has("heartRateZone") == true) {
                val hrz = json.getJSONObject("heartRateZone")
                com.deyarun.mobile.data.model.HeartRateZone(
                    min = hrz.optInt("min", 0),
                    max = hrz.optInt("max", 0)
                )
            } else null,
            calories = json?.optInt("calories", 0) ?: 0
        )
    }

    private fun parseExercises(json: JSONObject): com.deyarun.mobile.data.model.Exercises {
        return com.deyarun.mobile.data.model.Exercises(
            warmup = parseExerciseArray(json.optJSONArray("warmup")),
            cooldown = parseExerciseArray(json.optJSONArray("cooldown")),
            strengthening = parseExerciseArray(json.optJSONArray("strengthening"))
        )
    }

    private fun parseExerciseArray(jsonArray: org.json.JSONArray?): List<com.deyarun.mobile.data.model.Exercise> {
        if (jsonArray == null) return emptyList()
        val exercises = mutableListOf<com.deyarun.mobile.data.model.Exercise>()

        for (i in 0 until jsonArray.length()) {
            val exerciseJson = jsonArray.getJSONObject(i)
            exercises.add(parseExercise(exerciseJson))
        }

        return exercises
    }

    private fun parseExercise(json: JSONObject): com.deyarun.mobile.data.model.Exercise {
        return com.deyarun.mobile.data.model.Exercise(
            exerciseId = json.optString("exerciseId", ""),
            name = json.optString("name", ""),
            description = json.optString("description", ""),
            videoUrl = json.optString("videoUrl", ""),
            duration = if (json.has("duration")) {
                val dur = json.getJSONObject("duration")
                com.deyarun.mobile.data.model.DurationRange(
                    min = dur.optInt("min", 0),
                    max = dur.optInt("max", 0)
                )
            } else null,
            repetitions = if (json.has("repetitions")) {
                val reps = json.getJSONObject("repetitions")
                com.deyarun.mobile.data.model.RepetitionRange(
                    min = reps.optInt("min", 0),
                    max = reps.optInt("max", 0)
                )
            } else null,
            sets = if (json.has("sets")) {
                val sets = json.getJSONObject("sets")
                com.deyarun.mobile.data.model.SetsRange(
                    min = sets.optInt("min", 0),
                    max = sets.optInt("max", 0)
                )
            } else null,
            targetMuscles = parseStringArray(json.optJSONArray("targetMuscles"))
        )
    }

    private fun parseCompletionMetrics(json: JSONObject): com.deyarun.mobile.data.model.CompletionMetrics {
        return com.deyarun.mobile.data.model.CompletionMetrics(
            actualDistance = json.optInt("actualDistance", 0),
            actualDuration = json.optInt("actualDuration", 0),
            actualPace = json.optInt("actualPace", 0),
            completionDate = json.optString("completionDate", ""),
            effortLevel = json.optInt("effortLevel", 0),
            notes = json.optString("notes", "")
        )
    }

    private fun parseStringArray(jsonArray: org.json.JSONArray?): List<String> {
        if (jsonArray == null) return emptyList()
        val list = mutableListOf<String>()
        for (i in 0 until jsonArray.length()) {
            list.add(jsonArray.optString(i, ""))
        }
        return list
    }
}
