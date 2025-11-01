package com.deyarun.mobile.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.deyarun.mobile.data.model.PlannedWorkout
import com.deyarun.mobile.data.model.Exercise
import com.deyarun.mobile.data.repository.WeeklyProgramRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class WeeklyProgramUiState(
    val workouts: List<PlannedWorkout> = emptyList(),
    val selectedWorkout: PlannedWorkout? = null,
    val selectedExercise: Exercise? = null,
    val aiSuggestions: List<String> = emptyList(),
    val aiMotivation: String = "",
    val isLoading: Boolean = false,
    val isGenerating: Boolean = false,
    val isLoadingAI: Boolean = false,
    val error: String? = null
)

class WeeklyProgramViewModel(
    private val repository: WeeklyProgramRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(WeeklyProgramUiState())
    val uiState: StateFlow<WeeklyProgramUiState> = _uiState.asStateFlow()

    fun loadCurrentWeekProgram() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                val workouts = repository.getCurrentWeekWorkouts()
                _uiState.value = _uiState.value.copy(
                    workouts = workouts,
                    isLoading = false,
                    error = null
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.message ?: "Neizdevās ielādēt programmu"
                )
            }
        }
    }

    fun generateNewProgram() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isGenerating = true, error = null)
            try {
                repository.generateWeeklyProgram()
                // Reload workouts after generation
                loadCurrentWeekProgram()
                _uiState.value = _uiState.value.copy(isGenerating = false)
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isGenerating = false,
                    error = e.message ?: "Neizdevās ģenerēt programmu"
                )
            }
        }
    }

    fun selectWorkout(workout: PlannedWorkout) {
        _uiState.value = _uiState.value.copy(selectedWorkout = workout)
    }

    fun clearSelectedWorkout() {
        _uiState.value = _uiState.value.copy(selectedWorkout = null)
    }

    fun selectExercise(exercise: Exercise) {
        _uiState.value = _uiState.value.copy(selectedExercise = exercise)
    }

    fun clearSelectedExercise() {
        _uiState.value = _uiState.value.copy(selectedExercise = null)
    }

    fun markWorkoutComplete(workoutId: String) {
        viewModelScope.launch {
            try {
                repository.updateWorkoutStatus(workoutId, "completed")
                // Reload to get updated status
                loadCurrentWeekProgram()
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = e.message ?: "Neizdevās atjaunināt statusu"
                )
            }
        }
    }

    fun loadAICoachingSuggestions() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoadingAI = true)
            try {
                val response = repository.getAICoachingSuggestions()
                _uiState.value = _uiState.value.copy(
                    aiSuggestions = response.suggestions,
                    aiMotivation = response.motivation,
                    isLoadingAI = false
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoadingAI = false,
                    error = e.message ?: "Neizdevās ielādēt AI ieteikumus"
                )
            }
        }
    }
}
