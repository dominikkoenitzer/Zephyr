import {
  Play, SkipForward, Maximize2, RotateCcw, Plus, Trash2, Edit2,
  Target, Timer as TimerIcon,
} from 'lucide-react';
import { Button } from '../ui/button';
import { DEFAULT_PRESETS } from './presets';
import FullScreenMode from './FullScreenMode';
import PresetSettingsDialog from './PresetSettingsDialog';
import { formatTime, usePomodoro } from './usePomodoro';

const PomodoroTimer = () => {
  const {
    timeLeft,
    isRunning,
    progress,
    strokeDashoffset,
    circumference,
    currentSessionTime,
    sessionType,
    timerContainerRef,
    toggleTimer,
    resetTimer,
    skipSession,
    sessionsCompleted,
    totalFocusTime,
    sessionTask,
    presets,
    selectedPreset,
    currentPreset,
    handlePresetChange,
    handleCreatePreset,
    handleDeletePreset,
    isSettingsOpen,
    setIsSettingsOpen,
    editingPreset,
    setEditingPreset,
    editingPresetHex,
    newPresetName,
    setNewPresetName,
    presetColorDraft,
    setPresetColorDraft,
    handleSavePreset,
    cancelPresetEdit,
    isFullScreen,
    setIsFullScreen,
  } = usePomodoro();

  if (isFullScreen) {
    return (
      <FullScreenMode
        timeLeft={timeLeft}
        isRunning={isRunning}
        progress={progress}
        sessionType={sessionType}
        onToggle={toggleTimer}
        onReset={resetTimer}
        onSkip={skipSession}
        onExit={() => setIsFullScreen(false)}
        formatTime={formatTime}
        preset={currentPreset}
      />
    );
  }

  return (
    <div className="w-full content-wide px-responsive py-responsive space-y-(--section-gap)">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-(--panel-gap)">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
                {sessionType.text}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {currentPreset.name}
              </p>
              {sessionTask?.title && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs sm:text-sm text-foreground/80">
                  <Target className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="truncate max-w-[14rem] sm:max-w-sm">
                    {sessionTask.title}
                  </span>
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullScreen(true)}
              className="h-8 w-8 sm:h-9 sm:w-9"
              title="Full Screen"
            >
              <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>

          {/* Timer */}
          <div className="flex justify-center items-center py-6 sm:py-8 md:py-12">
            <div ref={timerContainerRef} className="relative w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] md:w-[400px] md:h-[400px]">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  className="text-muted-foreground/25"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  style={{
                    color: currentPreset.color,
                    strokeDasharray: circumference,
                    strokeDashoffset: strokeDashoffset,
                    transition: 'stroke-dashoffset 1s ease-out'
                  }}
                />
              </svg>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div 
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-mono font-light mb-1 sm:mb-2 tracking-tight"
                  style={{ color: currentPreset.color }}
                >
                  {formatTime(timeLeft)}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {Math.round(progress)}%
                </div>
              </div>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex justify-center items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={toggleTimer}
              aria-label={isRunning ? "Pause timer" : "Start timer"}
              title={isRunning ? "Pause timer" : "Start timer"}
              className={`
                h-14 w-14 sm:h-16 sm:w-16 rounded-full transition-all duration-300
                flex items-center justify-center relative
                ${isRunning
                  ? 'bg-foreground/10 hover:bg-foreground/15'
                  : 'btn-shine hover:scale-105 active:scale-95'
                }
              `}
              style={isRunning ? {} : { backgroundColor: currentPreset.color }}
            >
              {isRunning ? (
                <div className="flex items-center justify-center gap-1 z-10">
                  <div className="h-3.5 w-0.5 sm:h-4 sm:w-1 bg-foreground rounded-full" />
                  <div className="h-3.5 w-0.5 sm:h-4 sm:w-1 bg-foreground rounded-full" />
                </div>
              ) : (
                <Play className="h-6 w-6 sm:h-7 sm:w-7 text-white ml-0.5 z-10" strokeWidth={2.5} />
              )}
            </button>
            
            <Button
              onClick={resetTimer}
              aria-label="Reset timer"
              variant="ghost"
              size="sm"
              className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
              <span className="hidden sm:inline">Reset</span>
            </Button>

            <Button
              onClick={skipSession}
              aria-label="Skip session"
              variant="ghost"
              size="sm"
              className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm text-muted-foreground hover:text-foreground"
              disabled={timeLeft === currentSessionTime}
            >
              <SkipForward className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
              <span className="hidden sm:inline">Skip</span>
            </Button>
          </div>

          {/* Description */}
          {currentPreset.description && (
            <div className="text-center pt-3 sm:pt-4">
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed px-2">
                {currentPreset.description}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3 sm:space-y-4">
          {/* Presets */}
          <div className="space-y-1.5 sm:space-y-2">
            <h3 className="text-xs sm:text-sm font-medium text-muted-foreground px-1">Presets</h3>
            <div className="space-y-1.5">
              {presets.map(preset => {
                const defaultPreset = DEFAULT_PRESETS.find(dp => dp.id === preset.id);
                const Icon = defaultPreset ? defaultPreset.icon : (preset.icon || TimerIcon);
                const isSelected = selectedPreset === preset.id;
                const isDefault = !!defaultPreset;
                
                return (
                  <div
                    key={preset.id}
                    className={`
                      w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors cursor-pointer group
                      ${isSelected 
                        ? 'bg-accent' 
                        : 'hover:bg-accent/50'
                      }
                    `}
                    onClick={() => handlePresetChange(preset.id)}
                  >
                    {typeof Icon === 'function' ? (
                      <Icon className="h-4 w-4 shrink-0" style={{ color: isSelected ? preset.color : undefined }} />
                    ) : (
                      <TimerIcon className="h-4 w-4 shrink-0" style={{ color: isSelected ? preset.color : undefined }} />
                    )}
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{preset.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {Math.floor(preset.workTime / 60)} min
                      </div>
                    </div>
                    {isSelected && (
                      <div 
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: preset.color }}
                      />
                    )}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        aria-label={`Edit ${preset.name}`}
                        className="h-7 w-7 flex items-center justify-center rounded hover:bg-background transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPreset(preset);
                          setNewPresetName(preset.name);
                          setIsSettingsOpen(true);
                        }}
                      >
                        <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      {!isDefault && (
                        <button
                          type="button"
                          aria-label={`Delete ${preset.name}`}
                          className="h-7 w-7 flex items-center justify-center rounded hover:bg-background transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePreset(preset.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              
              <button
                onClick={handleCreatePreset}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors text-sm text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
                New Preset
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="pt-4 border-t border-border space-y-4">
            <div>
              <div className="text-2xl font-semibold text-foreground">{sessionsCompleted}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Sessions</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-foreground">{totalFocusTime}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Minutes</div>
            </div>
          </div>

          <PresetSettingsDialog
            open={isSettingsOpen}
            onOpenChange={setIsSettingsOpen}
            preset={editingPreset}
            onPresetChange={setEditingPreset}
            name={newPresetName}
            onNameChange={setNewPresetName}
            colorDraft={presetColorDraft}
            onColorDraftChange={setPresetColorDraft}
            colorHex={editingPresetHex}
            onSave={handleSavePreset}
            onCancel={cancelPresetEdit}
          />
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;
