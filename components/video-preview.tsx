"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Film,
  Music,
  Mic2,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import type { BrandScenarioData, StoryboardData, TimelineItem } from "@/app/page"

const I2V_API_URL = "https://gigicreation.store/api/i2v"
const MMAUDIO_API_URL = "https://gigicreation.store/api/mmaudio"
const LATENTSYNC_API_URL = "https://gigicreation.store/api/latentsync"
const TTS_API_URL = "https://gigicreation.store/api/elevenlabs"

type VideoItem = {
  index: number
  timelineItem: TimelineItem
  status: "pending" | "generating" | "completed" | "error"
  i2vStatus: "pending" | "processing" | "done" | "error"
  audioStatus: "pending" | "processing" | "done" | "error"
  lipsyncStatus: "pending" | "processing" | "done" | "error"
  i2vVideoUrl?: string
  mmAudioVideoUrl?: string
  ttsAudioUrl?: string
  finalVideoUrl?: string
  error?: string
}

// Helper: Base64 이미지를 File로 변환
const base64ToFile = async (base64: string, filename: string): Promise<File> => {
  const res = await fetch(base64)
  const blob = await res.blob()
  return new File([blob], filename, { type: blob.type || "image/png" })
}

// Helper: URL에서 파일 다운로드
const fetchFileFromUrl = async (url: string, filename: string): Promise<File> => {
  const res = await fetch(url)
  const blob = await res.blob()
  return new File([blob], filename, { type: blob.type })
}

type Props = {
  brandScenarioData: BrandScenarioData | null
  storyboardData: StoryboardData | null
  onBack: () => void
  onNext: (videoItems: VideoItem[]) => void
}

export default function VideoPreview({ brandScenarioData, storyboardData, onBack, onNext }: Props) {
  const [videoItems, setVideoItems] = useState<VideoItem[]>(() => {
    if (!storyboardData?.timeline) return []
    return storyboardData.timeline.map((item, index) => ({
      index,
      timelineItem: item,
      status: "pending",
      i2vStatus: "pending",
      audioStatus: "pending",
      lipsyncStatus: "pending",
    }))
  })
  const [isGeneratingAll, setIsGeneratingAll] = useState(false)
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const getStatusIcon = (status: "pending" | "processing" | "done" | "error") => {
    switch (status) {
      case "pending":
        return <div className="w-4 h-4 rounded-full bg-muted" />
      case "processing":
        return <Loader2 className="w-4 h-4 animate-spin text-primary" />
      case "done":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-destructive" />
    }
  }

  const getStatusText = (status: "pending" | "processing" | "done" | "error") => {
    switch (status) {
      case "pending":
        return "대기중"
      case "processing":
        return "처리중..."
      case "done":
        return "완료"
      case "error":
        return "오류"
    }
  }

  // Generate video for a single item
  const generateVideoForItem = async (index: number) => {
    const item = videoItems[index]
    if (!item.timelineItem.gigiImage) {
      setVideoItems(prev => prev.map((v, i) => 
        i === index ? { ...v, status: "error", error: "이미지가 없습니다" } : v
      ))
      return
    }

    // Update status to generating
    setVideoItems(prev => prev.map((v, i) => 
      i === index ? { ...v, status: "generating", i2vStatus: "processing" } : v
    ))

    const projectId = `scene_${Date.now()}_${index}`

    try {
      // ============================================
      // Step 1: Image to Video (i2v)
      // ============================================
      console.log(`[${index}] Step 1: Image to Video 변환 시작`)
      
      // Base64 이미지를 File로 변환
      const imageFile = await base64ToFile(
        item.timelineItem.gigiImage,
        `scene_${index}.png`
      )

      // 영어 프롬프트 생성 (action 기반)
      const actionPrompt = item.timelineItem.action || "The character looks at the camera with a gentle smile"

      const i2vFormData = new FormData()
      i2vFormData.append("image", imageFile)
      i2vFormData.append("prompt", actionPrompt)
      i2vFormData.append("project_id", projectId)
      i2vFormData.append("sequence", String(index + 1))
      i2vFormData.append("width", "512")
      i2vFormData.append("height", "512")
      i2vFormData.append("length", "121") // ~6초

      const i2vResponse = await fetch(`${I2V_API_URL}/generate`, {
        method: "POST",
        body: i2vFormData,
      })

      if (!i2vResponse.ok) {
        throw new Error(`i2v API 오류: ${i2vResponse.status}`)
      }

      const i2vData = await i2vResponse.json()
      if (!i2vData.success || !i2vData.output_file) {
        throw new Error("i2v 영상 생성 실패")
      }

      const i2vVideoUrl = `${I2V_API_URL}/output/${i2vData.output_file}`
      console.log(`[${index}] i2v 완료: ${i2vVideoUrl}`)
      
      setVideoItems(prev => prev.map((v, i) => 
        i === index ? { ...v, i2vStatus: "done", i2vVideoUrl, audioStatus: "processing" } : v
      ))

      // GPU 메모리 해제 대기
      await new Promise(resolve => setTimeout(resolve, 5000))

      // ============================================
      // Step 2: MMAudio (배경음 생성)
      // ============================================
      console.log(`[${index}] Step 2: 배경음 생성 시작`)
      
      // i2v 영상 다운로드
      const i2vVideoFile = await fetchFileFromUrl(i2vVideoUrl, `scene_${index}.mp4`)

      const mmAudioFormData = new FormData()
      mmAudioFormData.append("video", i2vVideoFile)
      mmAudioFormData.append("force_rate", "24")

      const mmAudioResponse = await fetch(`${MMAUDIO_API_URL}/generate`, {
        method: "POST",
        body: mmAudioFormData,
      })

      if (!mmAudioResponse.ok) {
        throw new Error(`mmaudio API 오류: ${mmAudioResponse.status}`)
      }

      const mmAudioData = await mmAudioResponse.json()
      if (!mmAudioData.success || !mmAudioData.output_file) {
        throw new Error("배경음 생성 실패")
      }

      const mmAudioVideoUrl = `${MMAUDIO_API_URL}/output/${mmAudioData.output_file}`
      console.log(`[${index}] mmaudio 완료: ${mmAudioVideoUrl}`)
      
      setVideoItems(prev => prev.map((v, i) => 
        i === index ? { ...v, audioStatus: "done", mmAudioVideoUrl, lipsyncStatus: "processing" } : v
      ))

      // GPU 메모리 해제 대기
      await new Promise(resolve => setTimeout(resolve, 5000))

      // ============================================
      // Step 3: TTS 음성 생성 (대사가 있는 경우)
      // ============================================
      let ttsAudioUrl: string | null = null
      
      if (item.timelineItem.dialogue && item.timelineItem.dialogue.trim()) {
        console.log(`[${index}] Step 3a: TTS 음성 생성 시작`)
        
        const ttsSessionId = `tts_${projectId}`
        const ttsResponse = await fetch(`${TTS_API_URL}/session/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            session_id: ttsSessionId,
            text: item.timelineItem.dialogue,
            output_filename: `dialogue_${index}.mp3`,
            stability: 0.8,
            similarity_boost: 0.8,
          }),
        })

        if (ttsResponse.ok) {
          const ttsData = await ttsResponse.json()
          if (ttsData.success && ttsData.filename) {
            ttsAudioUrl = `${TTS_API_URL}/session/${ttsSessionId}/audio/${ttsData.filename}`
            console.log(`[${index}] TTS 완료: ${ttsAudioUrl}`)
          }
        }
      }

      // ============================================
      // Step 4: LatentSync (립싱크 - 대사가 있는 경우만)
      // ============================================
      let finalVideoUrl = mmAudioVideoUrl // 대사 없으면 mmaudio 결과가 최종

      if (ttsAudioUrl) {
        console.log(`[${index}] Step 3b: 립싱크 영상 생성 시작`)
        
        // 배경음 영상과 TTS 오디오 다운로드
        const videoWithBgSound = await fetchFileFromUrl(mmAudioVideoUrl, `scene_${index}_bg.mp4`)
        const ttsAudioFile = await fetchFileFromUrl(ttsAudioUrl, `dialogue_${index}.mp3`)

        const lipsyncFormData = new FormData()
        lipsyncFormData.append("video", videoWithBgSound)
        lipsyncFormData.append("audio", ttsAudioFile)
        lipsyncFormData.append("lips_expression", "1.5")
        lipsyncFormData.append("inference_steps", "20")
        lipsyncFormData.append("fps", "25")

        const lipsyncResponse = await fetch(`${LATENTSYNC_API_URL}/generate`, {
          method: "POST",
          body: lipsyncFormData,
        })

        if (!lipsyncResponse.ok) {
          throw new Error(`latentsync API 오류: ${lipsyncResponse.status}`)
        }

        const lipsyncData = await lipsyncResponse.json()
        if (!lipsyncData.success || !lipsyncData.output_file) {
          throw new Error("립싱크 영상 생성 실패")
        }

        finalVideoUrl = `${LATENTSYNC_API_URL}/output/${lipsyncData.output_file}`
        console.log(`[${index}] 립싱크 완료: ${finalVideoUrl}`)
      } else {
        console.log(`[${index}] 대사 없음 - 립싱크 스킵`)
      }

      // All done
      setVideoItems(prev => prev.map((v, i) => 
        i === index ? { 
          ...v, 
          status: "completed", 
          lipsyncStatus: "done",
          ttsAudioUrl: ttsAudioUrl || undefined,
          finalVideoUrl,
        } : v
      ))

      console.log(`[${index}] 비디오 생성 완료!`)

    } catch (err) {
      console.error(`[${index}] 비디오 생성 실패:`, err)
      const errorMessage = err instanceof Error ? err.message : "비디오 생성 실패"
      setVideoItems(prev => prev.map((v, i) => 
        i === index ? { ...v, status: "error", error: errorMessage } : v
      ))
    }
  }

  // Generate all videos
  const handleGenerateAll = async () => {
    setIsGeneratingAll(true)
    setError(null)

    for (let i = 0; i < videoItems.length; i++) {
      if (videoItems[i].status !== "completed") {
        await generateVideoForItem(i)
        // GPU 메모리 해제를 위한 충분한 대기 시간
        if (i < videoItems.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 10000))
        }
      }
    }

    setIsGeneratingAll(false)
  }

  const allCompleted = videoItems.every(item => item.status === "completed")
  const hasAnyVideo = videoItems.some(item => item.status === "completed")

  return (
    <div className="max-w-6xl mx-auto px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">비디오 프리뷰</h1>
          <p className="text-muted-foreground">
            각 장면의 이미지를 영상으로 변환하고 효과음, 립싱크를 적용합니다
          </p>
        </div>
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          이전 단계
        </Button>
      </div>

      {/* Brand & Scenario Info */}
      {brandScenarioData && (
        <Card className="p-4 mb-6 bg-accent/30">
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 bg-primary/10 rounded-full text-primary font-medium">
              {brandScenarioData.brandName}
            </div>
            <div className="text-sm text-muted-foreground truncate flex-1">
              {brandScenarioData.scenario?.slice(0, 100)}...
            </div>
          </div>
        </Card>
      )}

      {/* Generate All Button */}
      <div className="mb-6">
        <Button 
          onClick={handleGenerateAll}
          disabled={isGeneratingAll || allCompleted}
          className="w-full py-6 text-lg"
        >
          {isGeneratingAll ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              비디오 생성 중...
            </>
          ) : allCompleted ? (
            <>
              <CheckCircle2 className="w-5 h-5 mr-2" />
              모든 비디오 생성 완료
            </>
          ) : (
            <>
              <Film className="w-5 h-5 mr-2" />
              전체 비디오 생성 시작
            </>
          )}
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Video Items Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {videoItems.map((item, index) => (
          <Card key={index} className="overflow-hidden">
            {/* Video Preview Area */}
            <div className="aspect-video bg-muted relative">
              {item.timelineItem.gigiImage ? (
                item.status === "completed" && item.finalVideoUrl ? (
                  <video
                    src={item.finalVideoUrl}
                    className="w-full h-full object-cover"
                    controls
                    onPlay={() => setCurrentPlayingIndex(index)}
                    onPause={() => setCurrentPlayingIndex(null)}
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <img
                      src={item.timelineItem.gigiImage}
                      alt={`장면 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {item.status === "generating" && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="text-center text-white">
                          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-2" />
                          <p className="text-sm">비디오 생성 중...</p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">이미지 없음</p>
                    <p className="text-xs opacity-70">이전 단계에서 이미지를 생성해주세요</p>
                  </div>
                </div>
              )}
            </div>

            {/* Info Area */}
            <div className="p-4">
              {/* Scene Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-primary/10 text-primary text-sm font-medium rounded">
                    장면 {index + 1}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {item.timelineItem.timestamp}
                  </span>
                </div>
                {item.status === "completed" && (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
              </div>

              {/* Dialogue */}
              {item.timelineItem.dialogue && (
                <p className="text-sm text-foreground mb-4 line-clamp-2">
                  "{item.timelineItem.dialogue}"
                </p>
              )}

              {/* Progress Steps */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-3 text-sm">
                  {getStatusIcon(item.i2vStatus)}
                  <Film className="w-4 h-4 text-muted-foreground" />
                  <span className="flex-1">이미지→영상 변환</span>
                  <span className="text-xs text-muted-foreground">{getStatusText(item.i2vStatus)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {getStatusIcon(item.audioStatus)}
                  <Music className="w-4 h-4 text-muted-foreground" />
                  <span className="flex-1">효과음 생성</span>
                  <span className="text-xs text-muted-foreground">{getStatusText(item.audioStatus)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {getStatusIcon(item.lipsyncStatus)}
                  <Mic2 className="w-4 h-4 text-muted-foreground" />
                  <span className="flex-1">립싱크 적용</span>
                  <span className="text-xs text-muted-foreground">{getStatusText(item.lipsyncStatus)}</span>
                </div>
              </div>

              {/* Individual Generate Button */}
              {item.status !== "completed" && !isGeneratingAll && (
                <>
                  {/* 첫 번째이거나 이전 비디오가 완료된 경우에만 버튼 표시 */}
                  {(index === 0 || videoItems[index - 1]?.status === "completed") ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => generateVideoForItem(index)}
                      disabled={item.status === "generating" || !item.timelineItem.gigiImage || videoItems.some(v => v.status === "generating")}
                    >
                      {item.status === "generating" ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          생성 중...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          이 장면 비디오 생성
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="w-full text-center py-2 text-sm text-muted-foreground">
                      이전 장면의 비디오를 먼저 생성해주세요
                    </div>
                  )}
                </>
              )}

              {/* Error Message */}
              {item.error && (
                <div className="mt-2 text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {item.error}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {videoItems.length === 0 && (
        <Card className="p-12 text-center">
          <Film className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">타임라인이 비어있습니다</h3>
          <p className="text-muted-foreground mb-4">
            이전 단계에서 타임라인을 생성해주세요
          </p>
          <Button variant="outline" onClick={onBack}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            이전 단계로 돌아가기
          </Button>
        </Card>
      )}

      {/* Next Step Button */}
      {videoItems.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={() => onNext(videoItems)}
            disabled={!hasAnyVideo}
            className="px-8"
          >
            최종 영상 생성
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  )
}

export type { VideoItem }

