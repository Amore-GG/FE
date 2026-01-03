"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  ChevronLeft, 
  Video, 
  Download, 
  Sparkles, 
  Clock, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Play,
  Film,
} from "lucide-react"
import type { BrandScenarioData, StoryboardData } from "@/app/page"
import type { VideoItem } from "@/components/video-preview"

const MERGE_API_URL = "https://gigicreation.store/api/merge"

type Props = {
  brandScenarioData: BrandScenarioData | null
  storyboardData: StoryboardData | null
  videoPreviewData: VideoItem[] | null
  onBack: () => void
}

export default function VideoGenerator({ brandScenarioData, storyboardData, videoPreviewData, onBack }: Props) {
  const [isMerging, setIsMerging] = useState(false)
  const [mergeProgress, setMergeProgress] = useState(0)
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sessionId] = useState(() => `project_${Date.now()}_${Math.random().toString(36).substring(7)}`)
  const [videoDuration, setVideoDuration] = useState<number | null>(null)

  // 완료된 비디오 목록
  const completedVideos = videoPreviewData?.filter(v => v.status === "completed" && v.finalVideoUrl) || []

  // 비디오 합치기
  const handleMergeVideos = async () => {
    if (completedVideos.length === 0) {
      setError("합칠 비디오가 없습니다. 이전 단계에서 비디오를 먼저 생성해주세요.")
      return
    }

    setIsMerging(true)
    setError(null)
    setMergeProgress(10)

    try {
      // Step 1: 각 비디오를 세션에 업로드
      console.log("Step 1: 비디오 파일들을 세션에 업로드 중...")
      setMergeProgress(20)

      const videoFiles: string[] = []
      
      for (let i = 0; i < completedVideos.length; i++) {
        const video = completedVideos[i]
        if (!video.finalVideoUrl) continue

        // 파일명 생성 (순서대로)
        const filename = `scene_${String(i + 1).padStart(3, "0")}.mp4`
        videoFiles.push(filename)

        // 비디오 다운로드
        const response = await fetch(video.finalVideoUrl)
        if (!response.ok) {
          throw new Error(`비디오 다운로드 실패: ${video.finalVideoUrl}`)
        }
        const blob = await response.blob()
        const file = new File([blob], filename, { type: "video/mp4" })

        // 세션에 업로드
        const uploadFormData = new FormData()
        uploadFormData.append("session_id", sessionId)
        uploadFormData.append("file", file)
        uploadFormData.append("filename", filename)

        const uploadResponse = await fetch(`${MERGE_API_URL}/session/upload`, {
          method: "POST",
          body: uploadFormData,
        })

        if (!uploadResponse.ok) {
          console.warn(`업로드 실패 (${filename}), 직접 합치기 시도`)
        }

        setMergeProgress(20 + Math.floor((i + 1) / completedVideos.length * 30))
        console.log(`업로드 완료: ${filename}`)
      }

      setMergeProgress(60)
      console.log("Step 2: 비디오 합치기 요청 중...")

      // Step 2: 비디오 합치기 API 호출
      const mergeResponse = await fetch(`${MERGE_API_URL}/session/merge/videos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          video_files: videoFiles,
          output_filename: "complete_video.mp4",
        }),
      })

      setMergeProgress(80)

      if (!mergeResponse.ok) {
        const errorText = await mergeResponse.text()
        throw new Error(`비디오 합치기 실패: ${mergeResponse.status} - ${errorText}`)
      }

      const mergeData = await mergeResponse.json()
      
      if (!mergeData.success) {
        throw new Error(mergeData.message || "비디오 합치기 실패")
      }

      console.log("비디오 합치기 완료:", mergeData)

      // 최종 비디오 URL 설정
      const finalUrl = `${MERGE_API_URL}/session/${sessionId}/file/${mergeData.output_file}`
      setFinalVideoUrl(finalUrl)
      setVideoDuration(mergeData.duration)
      setMergeProgress(100)

    } catch (err) {
      console.error("비디오 합치기 실패:", err)
      setError(err instanceof Error ? err.message : "비디오 합치기에 실패했습니다.")
    } finally {
      setIsMerging(false)
    }
  }

  // 다운로드 핸들러
  const handleDownload = () => {
    if (finalVideoUrl) {
      window.open(finalVideoUrl, "_blank")
    }
  }

  // 새 창에서 재생
  const handlePlayFullscreen = () => {
    if (finalVideoUrl) {
      window.open(finalVideoUrl, "_blank")
    }
  }

  const voiceData = storyboardData?.voiceSettings

  return (
    <div className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">최종 비디오 생성</h1>
        <p className="text-muted-foreground text-lg">
          생성된 장면들을 하나의 완성된 비디오로 합칩니다
        </p>
      </div>

      <div className="space-y-8">
        {/* 생성 정보 요약 */}
        <Card className="p-8">
          <h2 className="text-xl font-semibold mb-6">생성 정보</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* 브랜드 정보 */}
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-2">브랜드</div>
                <div className="text-base font-medium">{brandScenarioData?.brandName}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-2">생성된 장면</div>
                <div className="text-base font-medium">
                  {completedVideos.length}개 / {videoPreviewData?.length || 0}개
                </div>
              </div>
            </div>

            {/* 타임라인 미리보기 */}
            <div>
              <div className="text-sm text-muted-foreground mb-2">타임라인</div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {storyboardData?.timeline.slice(0, 5).map((item, index) => (
                  <div key={index} className="bg-muted/30 rounded p-2 text-xs flex items-center gap-2">
                    <div className="flex items-center gap-1 text-primary font-medium whitespace-nowrap">
                      <Clock className="h-3 w-3" />
                      {item.timestamp}
                    </div>
                    {completedVideos[index]?.status === "completed" && (
                      <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                ))}
                {storyboardData && storyboardData.timeline.length > 5 && (
                  <div className="text-xs text-muted-foreground text-center">
                    +{storyboardData.timeline.length - 5}개 더...
                  </div>
                )}
              </div>
            </div>

            {/* 음성 설정 */}
            <div>
              <div className="text-sm text-muted-foreground mb-2">음성 설정</div>
              <div className="bg-muted/30 rounded-lg p-4 space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">안정성:</span>{" "}
                  <span className="font-medium">{voiceData?.stability?.toFixed(2) ?? "0.80"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">유사도:</span>{" "}
                  <span className="font-medium">{voiceData?.similarityBoost?.toFixed(2) ?? "0.80"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">스타일:</span>{" "}
                  <span className="font-medium">{voiceData?.style?.toFixed(2) ?? "0.40"}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 비디오 미리보기 영역 */}
        <Card className="p-8">
          <div className="aspect-video bg-muted/30 rounded-lg overflow-hidden flex items-center justify-center mb-6">
            {finalVideoUrl ? (
              <div className="relative w-full h-full">
                <video
                  src={finalVideoUrl}
                  className="w-full h-full object-contain bg-black"
                  controls
                  autoPlay={false}
                />
              </div>
            ) : isMerging ? (
              <div className="text-center space-y-4 p-8">
                <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin" />
                <div className="space-y-2">
                  <div className="text-lg font-medium">비디오 합치는 중...</div>
                  <div className="text-sm text-muted-foreground">
                    {mergeProgress < 50 ? "장면 업로드 중..." : 
                     mergeProgress < 80 ? "비디오 합치는 중..." : 
                     "최종 처리 중..."}
                  </div>
                  <div className="w-64 h-2 bg-muted rounded-full overflow-hidden mx-auto mt-4">
                    <div 
                      className="h-full bg-primary transition-all duration-500" 
                      style={{ width: `${mergeProgress}%` }} 
                    />
                  </div>
                  <div className="text-sm font-medium text-primary">{mergeProgress}%</div>
                </div>
              </div>
            ) : completedVideos.length === 0 ? (
              <div className="text-center p-8">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive/50" />
                <p className="text-muted-foreground mb-2">생성된 장면 비디오가 없습니다</p>
                <p className="text-sm text-muted-foreground">이전 단계에서 비디오를 먼저 생성해주세요</p>
              </div>
            ) : (
              <div className="text-center p-8">
                <Film className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground mb-2">
                  {completedVideos.length}개의 장면이 준비되었습니다
                </p>
                <p className="text-sm text-muted-foreground">
                  비디오 합치기 버튼을 눌러 최종 비디오를 만들어보세요
                </p>
              </div>
            )}
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* 완료 정보 */}
          {finalVideoUrl && videoDuration && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">
                비디오 생성 완료! 총 {completedVideos.length}개 장면, {videoDuration.toFixed(1)}초
              </span>
            </div>
          )}

          {/* 버튼 영역 */}
          <div className="flex gap-3">
            <Button onClick={onBack} variant="outline" className="flex-1 bg-transparent">
              <ChevronLeft className="mr-2 h-4 w-4" />
              이전
            </Button>

            {!finalVideoUrl ? (
              <Button 
                onClick={handleMergeVideos} 
                disabled={isMerging || completedVideos.length === 0} 
                className="flex-1" 
                size="lg"
              >
                {isMerging ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    합치는 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    비디오 합치기 ({completedVideos.length}개)
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button onClick={handleMergeVideos} variant="outline" className="flex-1 bg-transparent">
                  <Sparkles className="mr-2 h-4 w-4" />
                  다시 생성
                </Button>
                <Button onClick={handlePlayFullscreen} variant="outline" className="flex-1 bg-transparent">
                  <Play className="mr-2 h-4 w-4" />
                  새 창에서 재생
                </Button>
                <Button onClick={handleDownload} className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  다운로드
                </Button>
              </>
            )}
          </div>
        </Card>

        {/* 장면별 비디오 미리보기 */}
        {completedVideos.length > 0 && (
          <Card className="p-8">
            <h2 className="text-xl font-semibold mb-6">장면별 비디오</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {completedVideos.map((video, index) => (
                <div key={index} className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                  {video.finalVideoUrl ? (
                    <video
                      src={video.finalVideoUrl}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                      onMouseLeave={(e) => {
                        const vid = e.target as HTMLVideoElement
                        vid.pause()
                        vid.currentTime = 0
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <div className="text-white text-xs font-medium">
                      장면 {index + 1}
                    </div>
                    <div className="text-white/70 text-xs">
                      {video.timelineItem.timestamp}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
