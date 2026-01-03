"use client"

import type React from "react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import {
  ChevronLeft,
  Sparkles,
  Clock,
  Upload,
  X,
  Volume2,
  Play,
  ImageIcon,
  Mic,
} from "lucide-react"
import type { BrandScenarioData, TimelineItem, StoryboardData } from "@/app/page"

const TTS_API_URL = "https://gigicreation.store/api/elevenlabs"
const IMAGE_API_URL = "https://gigicreation.store/api/zimage"
const QWEN_API_URL = "https://gigicreation.store/api/qwen"
const SCENARIO_API_URL = "https://gigicreation.store/api/scenario"

type Props = {
  brandScenarioData: BrandScenarioData | null
  onBack: () => void
  onNext: (data: StoryboardData) => void
}

export default function TimelineStoryboard({ brandScenarioData, onBack, onNext }: Props) {
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [isGeneratingTimeline, setIsGeneratingTimeline] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [regeneratingImageIndex, setRegeneratingImageIndex] = useState<number | null>(null)

  // Voice settings (applied snapshot)
  const [appliedVoiceSettings, setAppliedVoiceSettings] = useState<{
    stability: number
    similarityBoost: number
    style: number
  } | null>(null)
  const [isVoiceSettingsApplied, setIsVoiceSettingsApplied] = useState(false)

  // Voice settings (UI) - ElevenLabs API 스펙에 맞춤
  const [stability, setStability] = useState([0.8])
  const [similarityBoost, setSimilarityBoost] = useState([0.8])
  const [style, setStyle] = useState([0.4])
  const [playingAudioIndex, setPlayingAudioIndex] = useState<number | null>(null)

  // Style refs for currently editing timeline item
  const [hairReference, setHairReference] = useState<string | null>(null)
  const [outfitReference, setOutfitReference] = useState<string | null>(null)

  const hairInputRef = useRef<HTMLInputElement>(null)
  const outfitInputRef = useRef<HTMLInputElement>(null)

  const handleStyleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (value: string | null) => void
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setter(reader.result as string)
    reader.readAsDataURL(file)
  }

  const [generatingImageIndex, setGeneratingImageIndex] = useState<number | null>(null)

  const handleGenerateTimeline = async () => {
    if (!brandScenarioData?.scenario) {
      console.error("시나리오가 없습니다.")
      return
    }

    setIsGeneratingTimeline(true)
    setError(null) // 에러 초기화
    setTimeline([]) // 기존 타임라인 초기화

    try {
      const response = await fetch(`${SCENARIO_API_URL}/generate-timetable-stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scenario: brandScenarioData.scenario,
          video_duration: 25,
          brand: brandScenarioData.brandName,
        }),
      })

      if (!response.ok) {
        throw new Error("타임테이블 생성에 실패했습니다.")
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("스트림 리더를 생성할 수 없습니다.")
      }

      const decoder = new TextDecoder()
      let buffer = ""
      const generatedTimeline: TimelineItem[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        
        // SSE 이벤트 파싱
        const lines = buffer.split("\n")
        buffer = lines.pop() || "" // 마지막 불완전한 라인은 버퍼에 유지

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6).trim()
            if (jsonStr && jsonStr !== "[DONE]") {
              try {
                const parsed = JSON.parse(jsonStr)
                
                // type에 따라 처리
                if (parsed.type === "metadata") {
                  console.log("타임테이블 메타데이터:", parsed.data)
                } else if (parsed.type === "scene") {
                  const sceneData = parsed.data
                  
                  // API 응답을 TimelineItem으로 변환
                  // scene_description: 전체 장면 설명 (한글)
                  // t2i_prompt: 이미지 생성용 프롬프트 (영어)
                  // image_edit_prompt: 행동/표정 변화 (영어)
                  
                  // 배경: scene_description 사용 (전체 장면 설명)
                  const sceneText = sceneData.scene_description || ""
                  
                  // 행동: image_edit_prompt의 pose_change, gaze_change, expression 조합
                  let actionText = ""
                  if (sceneData.image_edit_prompt) {
                    const parts = []
                    if (sceneData.image_edit_prompt.pose_change) {
                      parts.push(`포즈: ${sceneData.image_edit_prompt.pose_change}`)
                    }
                    if (sceneData.image_edit_prompt.gaze_change) {
                      parts.push(`시선: ${sceneData.image_edit_prompt.gaze_change}`)
                    }
                    if (sceneData.image_edit_prompt.expression) {
                      parts.push(`표정: ${sceneData.image_edit_prompt.expression}`)
                    }
                    actionText = parts.join(" / ")
                  }
                  // image_edit_prompt 없으면 t2i_prompt의 character_pose_and_gaze 사용
                  if (!actionText && sceneData.t2i_prompt?.character_pose_and_gaze) {
                    actionText = sceneData.t2i_prompt.character_pose_and_gaze
                  }

                  const timelineItem: TimelineItem = {
                    index: sceneData.index,
                    timestamp: `${formatTime(sceneData.time_start)} - ${formatTime(sceneData.time_end)}`,
                    timeStart: sceneData.time_start,
                    timeEnd: sceneData.time_end,
                    scene: sceneText,
                    action: actionText,
                    dialogue: sceneData.dialogue || "",
                    backgroundSoundsPrompt: sceneData.background_sounds_prompt,
                    t2iPrompt: sceneData.t2i_prompt ? {
                      background: sceneData.t2i_prompt.background,
                      characterPoseAndGaze: sceneData.t2i_prompt.character_pose_and_gaze,
                      product: sceneData.t2i_prompt.product,
                      cameraAngle: sceneData.t2i_prompt.camera_angle,
                    } : undefined,
                    imageEditPrompt: sceneData.image_edit_prompt ? {
                      poseChange: sceneData.image_edit_prompt.pose_change,
                      gazeChange: sceneData.image_edit_prompt.gaze_change,
                      expression: sceneData.image_edit_prompt.expression,
                      additionalEdits: sceneData.image_edit_prompt.additional_edits,
                    } : undefined,
                    voiceType: "gigi",
                  }

                  generatedTimeline.push(timelineItem)
                  // 실시간으로 타임라인 업데이트
                  setTimeline([...generatedTimeline])
                  console.log(`장면 ${sceneData.index + 1} 생성 완료`)
                } else if (parsed.type === "complete") {
                  console.log("타임테이블 생성 완료:", parsed.data)
                }
              } catch (parseError) {
                console.error("JSON 파싱 오류:", parseError)
              }
            }
          }
        }
      }

      console.log("타임테이블 생성 완료!", generatedTimeline.length, "개 장면")
    } catch (err) {
      console.error("타임테이블 생성 실패:", err)
      setError("타임테이블 생성에 실패했습니다. 다시 시도해주세요.")
    } finally {
      setIsGeneratingTimeline(false)
    }
  }

  // 시간 포맷팅 헬퍼 함수
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleGenerateImage = async (index: number) => {
    setGeneratingImageIndex(index)

    try {
      const sessionId = `scene_${index}_${Date.now()}_${Math.random().toString(36).substring(7)}`
      const item = timeline[index]

      // ========== Step 1: 배경 이미지 생성 (z_image - 4400) ==========
      console.log("Step 1: 배경 이미지 생성 시작...")
      const backgroundResponse = await fetch(`${IMAGE_API_URL}/session/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          prompt: item.scene,
          negative_prompt: "blurry ugly bad distorted low quality person human",
          output_filename: "background.png",
          width: 512,
          height: 512,
          steps: 9,
          cfg: 1.0,
        }),
      })

      if (!backgroundResponse.ok) {
        throw new Error("배경 이미지 생성 실패")
      }

      const backgroundData = await backgroundResponse.json()
      if (!backgroundData.success) {
        throw new Error("배경 이미지 생성 응답 오류")
      }
      console.log("Step 1 완료: 배경 이미지 생성됨")

      // GPU 메모리 확보를 위한 대기 (20초)
      console.log("GPU 메모리 확보를 위해 20초 대기...")
      await delay(20000)

      // ========== Step 2: 지지 이미지 생성 (Qwen - /session/edit/gigi) ==========
      console.log("Step 2: 지지 이미지 생성 시작...")
      const actionPrompt = item.action || "frontal view, looking at camera, slight smile"
      const gigiPrompt = `${actionPrompt}, high quality portrait, professional lighting, white background`

      const gigiResult = await generateGigiImage(
        sessionId,
        gigiPrompt,
        "gigi_person.png"
      )

      if (!gigiResult) {
        throw new Error("지지 이미지 생성 실패")
      }
      console.log("Step 2 완료: 지지 이미지 생성됨")

      // ========== Step 3: 배경 + 지지 합성 (Qwen - /session/edit) ==========
      console.log("Step 3: 배경과 지지 합성 시작...")
      const compositePrompt = "Seamlessly place the person from the second image into the background scene of the first image. Maintain natural lighting and shadows. The person should blend naturally with the environment."

      const compositeResult = await editImageWithQwen(
        sessionId,
        compositePrompt,
        "background.png",
        "final_composite.png",
        gigiResult
      )

      if (!compositeResult) {
        throw new Error("이미지 합성 실패")
      }
      console.log("Step 3 완료: 배경 + 지지 합성됨")

      // 최종 이미지 URL 구성
      const finalImageUrl = `${QWEN_API_URL}/session/${sessionId}/file/${compositeResult}`

      const updatedTimeline = [...timeline]
      updatedTimeline[index] = {
        ...updatedTimeline[index],
        gigiImage: finalImageUrl,
      }

      setTimeline(updatedTimeline)
      console.log("이미지 생성 완료!")
    } catch (err) {
      console.error("이미지 생성 파이프라인 실패:", err)
    } finally {
      setGeneratingImageIndex(null)
    }
  }

  const handleStyleScene = (index: number) => {
    setEditingIndex(index)

    // 현재 장면 값으로 편집 패널 세팅
    setHairReference(timeline[index].hairReference || null)
    setOutfitReference(timeline[index].outfitReference || null)
  }

  // GPU 메모리 확보를 위한 지연 함수
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  // Data URL을 Blob으로 변환하는 헬퍼 함수
  const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
    const response = await fetch(dataUrl)
    return response.blob()
  }

  // Qwen API - 지지 얼굴 기반 이미지 생성 (FormData 사용)
  const generateGigiImage = async (
    sessionId: string,
    prompt: string,
    outputFilename: string,
    styleImage?: string | null,  // 헤어 참조 이미지 (Data URL)
    styleImage2?: string | null  // 옷 참조 이미지 (Data URL)
  ): Promise<string | null> => {
    try {
      console.log(`Qwen 지지 API 호출: ${outputFilename} 생성 중...`)
      
      const formData = new FormData()
      formData.append("session_id", sessionId)
      formData.append("prompt", prompt)
      formData.append("output_filename", outputFilename)

      // 스타일 참조 이미지 1 (헤어)
      if (styleImage) {
        const blob = await dataUrlToBlob(styleImage)
        formData.append("style_image", blob, "style_reference_1.png")
      }

      // 스타일 참조 이미지 2 (옷)
      if (styleImage2) {
        const blob = await dataUrlToBlob(styleImage2)
        formData.append("style_image2", blob, "style_reference_2.png")
      }

      const response = await fetch(`${QWEN_API_URL}/session/edit/gigi`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Qwen 지지 API 응답 오류:", errorText)
        throw new Error("지지 이미지 생성 실패")
      }

      const data = await response.json()
      console.log(`Qwen 지지 API 완료: ${data.output_file}`)
      
      // Qwen 호출 후 GPU 메모리 정리를 위해 충분히 대기
      console.log("GPU 메모리 정리를 위해 15초 대기...")
      await delay(15000)
      
      return data.success ? data.output_file : null
    } catch (err) {
      console.error("지지 이미지 생성 실패:", err)
      return null
    }
  }

  // Qwen API - 세션 기반 이미지 편집 (JSON 사용) - 합성용
  const editImageWithQwen = async (
    sessionId: string,
    prompt: string,
    image1Filename: string,
    outputFilename: string,
    image2Filename?: string
  ): Promise<string | null> => {
    try {
      console.log(`Qwen 편집 API 호출: ${outputFilename} 생성 중...`)
      
      const requestBody: {
        session_id: string
        prompt: string
        image1_filename: string
        output_filename: string
        image2_filename?: string
      } = {
        session_id: sessionId,
        prompt,
        image1_filename: image1Filename,
        output_filename: outputFilename,
      }

      if (image2Filename) {
        requestBody.image2_filename = image2Filename
      }

      const response = await fetch(`${QWEN_API_URL}/session/edit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Qwen 편집 API 응답 오류:", errorText)
        throw new Error("이미지 편집 실패")
      }

      const data = await response.json()
      console.log(`Qwen 편집 API 완료: ${data.output_file}`)
      
      // Qwen 호출 후 GPU 메모리 정리를 위해 충분히 대기
      console.log("GPU 메모리 정리를 위해 15초 대기...")
      await delay(15000)
      
      return data.success ? data.output_file : null
    } catch (err) {
      console.error("이미지 편집 실패:", err)
      return null
    }
  }

  const handleGenerateSceneImage = async () => {
    if (editingIndex === null) return

    setRegeneratingImageIndex(editingIndex)

    try {
      const sessionId = `styled_${Date.now()}_${Math.random().toString(36).substring(7)}`
      const item = timeline[editingIndex]

      // ========== 스타일링된 지지 이미지 생성 (Qwen - /session/edit/gigi) ==========
      console.log("스타일링된 지지 이미지 생성 시작...")
      
      // 프롬프트 구성: 행동 + 장면 (스타일은 참조 이미지로만 적용)
      const actionPrompt = item.action || "frontal view, looking at camera, slight smile"
      const sceneDescription = item.scene || "studio lighting, professional photo"
      
      const fullPrompt = `${actionPrompt}, ${sceneDescription}, high quality portrait, professional lighting`
      
      console.log("프롬프트:", fullPrompt)

      // 스타일 참조 이미지 전달 (헤어 -> style_image, 옷 -> style_image2)
      const gigiResult = await generateGigiImage(
        sessionId,
        fullPrompt,
        "gigi_styled.png",
        hairReference,   // 헤어 참조 이미지
        outfitReference  // 옷 참조 이미지
      )

      if (!gigiResult) {
        throw new Error("스타일링된 지지 이미지 생성 실패")
      }
      console.log("스타일링된 지지 이미지 생성 완료!")

      // 최종 이미지 URL 구성
      const finalImageUrl = `${QWEN_API_URL}/session/${sessionId}/file/${gigiResult}`

      const updatedTimeline = [...timeline]
      updatedTimeline[editingIndex] = {
        ...updatedTimeline[editingIndex],
        gigiImage: finalImageUrl,
        hairReference: hairReference || undefined,
        outfitReference: outfitReference || undefined,
      }

      setTimeline(updatedTimeline)
      console.log("스타일링 완료!")
    } catch (err) {
      console.error("스타일 이미지 생성 파이프라인 실패:", err)
    } finally {
      setRegeneratingImageIndex(null)
      setEditingIndex(null)
    }
  }

  const audioRef = useRef<HTMLAudioElement | null>(null)

  const handlePlayAudio = async (index: number) => {
    const voiceType = timeline[index].voiceType || "gigi"

    // 나레이션은 아직 미지원
    if (voiceType === "narration") {
      console.log("나레이션 음성은 아직 지원되지 않습니다.")
      return
    }

    setPlayingAudioIndex(index)

    try {
      const sessionId = `tts_${index}_${Date.now()}`
      const outputFilename = `tts_${index}_${Date.now()}.mp3`

      const requestBody = {
        session_id: sessionId,
        text: timeline[index].dialogue,
        output_filename: outputFilename,
        stability: appliedVoiceSettings?.stability ?? stability[0],
        similarity_boost: appliedVoiceSettings?.similarityBoost ?? similarityBoost[0],
        style: appliedVoiceSettings?.style ?? style[0],
        use_speaker_boost: true,
      }

      const response = await fetch(`${TTS_API_URL}/session/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error("음성 생성에 실패했습니다.")
      }

      const data = await response.json()

      if (data.success && data.filename) {
        // 기존 오디오 정지
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current = null
        }

        // 오디오 URL 구성 (세션 기반)
        const audioUrl = `${TTS_API_URL}/session/${sessionId}/audio/${data.filename}`

        // 새 오디오 재생
        const audio = new Audio(audioUrl)
        audioRef.current = audio

        audio.onended = () => {
          setPlayingAudioIndex(null)
        }

        audio.onerror = () => {
          console.error("오디오 재생 중 오류 발생")
          setPlayingAudioIndex(null)
        }

        await audio.play()
      } else {
        throw new Error("음성 응답 형식이 올바르지 않습니다.")
      }
    } catch (err) {
      console.error("음성 생성 실패:", err)
      setPlayingAudioIndex(null)
    }
  }

  const handleApplyVoiceSettings = () => {
    setAppliedVoiceSettings({
      stability: stability[0],
      similarityBoost: similarityBoost[0],
      style: style[0],
    })
    setIsVoiceSettingsApplied(true)

    setTimeout(() => setIsVoiceSettingsApplied(false), 2000)
  }

  const handleSelectVoiceType = (index: number, type: "gigi" | "narration") => {
    const newTimeline = [...timeline]
    newTimeline[index].voiceType = type
    setTimeline(newTimeline)
  }

  return (
    <div className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">타임라인 & 스토리보드</h1>
        <p className="text-muted-foreground text-lg">각 장면마다 지지의 스타일을 설정하고 음성을 조정하세요</p>
      </div>

      <div className="space-y-6">
        {/* Timeline Generation */}
        {timeline.length === 0 && (
          <Card className="p-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-6">타임라인 생성</h2>
              <Button onClick={handleGenerateTimeline} disabled={isGeneratingTimeline} size="lg">
                {isGeneratingTimeline ? (
                  <>
                    <Clock className="mr-2 h-5 w-5 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Clock className="mr-2 h-5 w-5" />
                    타임라인 생성하기
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Timeline Display */}
        {timeline.length > 0 && (
          <div className="space-y-6">
            {timeline.map((item, index) => (
              <Card key={index} className="p-6">
                {/* 상단: 2컬럼 */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Left Column - Image */}
                  <div className="relative">
                    <div className="aspect-video rounded-lg overflow-hidden bg-muted border-2 border-border">
                      {generatingImageIndex === index ? (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 border-4 border-muted-foreground/20 rounded-full"></div>
                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                          </div>
                          <span className="text-sm text-muted-foreground">이미지 생성 중...</span>
                        </div>
                      ) : item.gigiImage ? (
                        <img
                          src={item.gigiImage}
                          alt={`Scene ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                          <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
                          {/* 첫 번째 이미지이거나 이전 이미지가 생성된 경우에만 버튼 활성화 */}
                          {(index === 0 || timeline[index - 1]?.gigiImage) ? (
                            <Button
                              onClick={() => handleGenerateImage(index)}
                              variant="secondary"
                              size="sm"
                              disabled={generatingImageIndex !== null}
                            >
                              <Sparkles className="mr-2 h-4 w-4" />
                              이미지 생성
                            </Button>
                          ) : (
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">이전 장면의 이미지를</p>
                              <p className="text-sm text-muted-foreground">먼저 생성해주세요</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-2">
                      <Button onClick={() => handleStyleScene(index)} variant="secondary" size="sm" className="flex-1">
                        <Sparkles className="mr-2 h-4 w-4" />
                        지지 스타일링
                      </Button>

                      <Button
                        onClick={() => handlePlayAudio(index)}
                        disabled={!item.voiceType || playingAudioIndex === index}
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                      >
                        {playingAudioIndex === index ? (
                          <>
                            <Volume2 className="mr-2 h-4 w-4 animate-pulse" />
                            재생 중...
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            음성 듣기
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Right Column - Scene Info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-xl font-bold text-primary">{index + 1}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold text-primary">{item.timestamp}</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground mb-1">장면 설명</div>
                      <div className="font-medium text-sm">{item.scene || "(장면 설명 없음)"}</div>
                    </div>

                    {item.t2iPrompt?.background && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">배경 (이미지 생성용)</div>
                        <div className="font-medium text-sm text-muted-foreground/80">{item.t2iPrompt.background}</div>
                      </div>
                    )}

                    <div>
                      <div className="text-sm text-muted-foreground mb-1">행동</div>
                      <div className="font-medium text-sm text-primary/80">{item.action || "(행동 정보 없음)"}</div>
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground mb-1">대사</div>
                      <div className="text-foreground">{item.dialogue ? `"${item.dialogue}"` : "(대사 없음)"}</div>
                    </div>

                    {item.t2iPrompt?.product && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">제품</div>
                        <div className="font-medium text-sm text-accent-foreground">{item.t2iPrompt.product}</div>
                      </div>
                    )}

                    <div>
                      <div className="text-sm text-muted-foreground mb-2">음성 유형 선택</div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSelectVoiceType(index, "gigi")}
                          variant={item.voiceType === "gigi" ? "default" : "outline"}
                          size="sm"
                          className="flex-1"
                        >
                          <Mic className="mr-2 h-4 w-4" />
                          지지 목소리
                        </Button>
                        <Button
                          onClick={() => handleSelectVoiceType(index, "narration")}
                          variant={item.voiceType === "narration" ? "default" : "outline"}
                          size="sm"
                          className="flex-1"
                        >
                          <Volume2 className="mr-2 h-4 w-4" />
                          나레이션
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 카드 하단: 스타일 설정 UI (해당 카드에만 열림) */}
                {editingIndex === index && (
                  <div className="mt-6 pt-4 border-t border-border space-y-4">
                    <h3 className="text-base font-semibold">장면 {index + 1} - 지지 스타일 설정</h3>

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Hair */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">머리 스타일</Label>
                        <input
                          ref={hairInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleStyleFileUpload(e, setHairReference)}
                          className="hidden"
                        />
                        {hairReference ? (
                          <div className="relative w-full aspect-video rounded overflow-hidden border">
                            <img src={hairReference} alt="Hair" className="w-full h-full object-cover" />
                            <Button
                              onClick={() => setHairReference(null)}
                              size="icon"
                              variant="destructive"
                              className="absolute top-1 right-1 h-6 w-6"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => hairInputRef.current?.click()}
                            variant="outline"
                            size="sm"
                            className="w-full border-dashed"
                          >
                            <Upload className="mr-2 h-3 w-3" />
                            사진
                          </Button>
                        )}
                      </div>

                      {/* Outfit */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">옷 스타일</Label>
                        <input
                          ref={outfitInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleStyleFileUpload(e, setOutfitReference)}
                          className="hidden"
                        />
                        {outfitReference ? (
                          <div className="relative w-full aspect-video rounded overflow-hidden border">
                            <img src={outfitReference} alt="Outfit" className="w-full h-full object-cover" />
                            <Button
                              onClick={() => setOutfitReference(null)}
                              size="icon"
                              variant="destructive"
                              className="absolute top-1 right-1 h-6 w-6"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => outfitInputRef.current?.click()}
                            variant="outline"
                            size="sm"
                            className="w-full border-dashed"
                          >
                            <Upload className="mr-2 h-3 w-3" />
                            사진
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button onClick={() => setEditingIndex(null)} variant="outline" className="flex-1">
                        취소
                      </Button>
                      <Button
                        onClick={handleGenerateSceneImage}
                        disabled={regeneratingImageIndex === index}
                        className="flex-1"
                      >
                        {regeneratingImageIndex === index ? (
                          <>
                            <Clock className="mr-2 h-4 w-4 animate-spin" />
                            이미지 생성 중...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            이미지 생성
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Voice Settings */}
        {timeline.length > 0 && (
          <Card className="p-8">
            <h2 className="text-2xl font-semibold mb-6">음성 설정</h2>
            <p className="text-sm text-muted-foreground mb-4">
              음성 설정을 변경한 후 &quot;음성 설정 적용&quot; 버튼을 클릭하면 타임라인의 &quot;음성 듣기&quot;가 새로운
              설정으로 재생됩니다.
            </p>

            <div className="space-y-6">
              {/* Stability */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">안정성 (Stability)</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      높을수록 일관된 음성, 낮을수록 다양한 표현
                    </p>
                  </div>
                  <span className="text-sm font-medium text-primary">{stability[0].toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground w-12">다양함</span>
                  <Slider 
                    value={stability} 
                    onValueChange={setStability} 
                    min={0} 
                    max={1} 
                    step={0.05} 
                    className="flex-1" 
                  />
                  <span className="text-xs text-muted-foreground w-12 text-right">안정적</span>
                </div>
              </div>

              {/* Similarity Boost */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">유사도 (Similarity)</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      높을수록 원본 음성에 가깝게 유지
                    </p>
                  </div>
                  <span className="text-sm font-medium text-primary">{similarityBoost[0].toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground w-12">낮음</span>
                  <Slider 
                    value={similarityBoost} 
                    onValueChange={setSimilarityBoost} 
                    min={0} 
                    max={1} 
                    step={0.05} 
                    className="flex-1" 
                  />
                  <span className="text-xs text-muted-foreground w-12 text-right">높음</span>
                </div>
              </div>

              {/* Style */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">스타일 (Style)</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      높을수록 감정 표현이 풍부해짐
                    </p>
                  </div>
                  <span className="text-sm font-medium text-primary">{style[0].toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground w-12">차분함</span>
                  <Slider 
                    value={style} 
                    onValueChange={setStyle} 
                    min={0} 
                    max={1} 
                    step={0.05} 
                    className="flex-1" 
                  />
                  <span className="text-xs text-muted-foreground w-12 text-right">풍부함</span>
                </div>
              </div>

              {/* Summary Card */}
              <Card className="p-4 bg-muted/30">
                <div className="flex items-start gap-3">
                  <Volume2 className="h-5 w-5 text-primary mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-medium text-sm">음성 설정 요약</div>
                    <div className="text-xs text-muted-foreground">
                      안정성: {stability[0].toFixed(2)} | 유사도: {similarityBoost[0].toFixed(2)} | 스타일: {style[0].toFixed(2)}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="mt-6">
              <Button onClick={handleApplyVoiceSettings} size="lg" className="w-full">
                {isVoiceSettingsApplied ? (
                  <>
                    <Volume2 className="mr-2 h-5 w-5" />
                    음성 설정 완료!
                  </>
                ) : (
                  <>
                    <Volume2 className="mr-2 h-5 w-5" />
                    음성 설정 적용
                  </>
                )}
              </Button>

              {appliedVoiceSettings && !isVoiceSettingsApplied && (
                <div className="mt-3 p-3 bg-primary/10 rounded-lg text-center">
                  <p className="text-sm text-primary font-medium">
                    ✓ 음성 설정이 적용되었습니다. 타임라인에서 &quot;음성 듣기&quot;를 눌러 확인하세요.
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-4 mt-8">
        <Button onClick={onBack} variant="outline" size="lg" className="flex-1 bg-transparent">
          <ChevronLeft className="mr-2 h-5 w-5" />
          이전 단계
        </Button>

        <Button
          onClick={() => {
            const voiceText = timeline.map((t) => t.dialogue).join("\n")
            onNext({
              timeline,
              voiceSettings: {
                text: voiceText,
                stability: appliedVoiceSettings?.stability ?? stability[0],
                similarityBoost: appliedVoiceSettings?.similarityBoost ?? similarityBoost[0],
                style: appliedVoiceSettings?.style ?? style[0],
              },
            })
          }}
          size="lg"
          className="flex-1"
          disabled={timeline.length === 0}
        >
          비디오 생성하기
          <Sparkles className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}