"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { ChevronLeft, Sparkles, Clock, Upload, X, Volume2, Play, ImageIcon, Copy } from "lucide-react"
import type { BrandScenarioData, TimelineItem, StoryboardData } from "@/app/page"
import { Mic } from "lucide-react"

type Props = {
  brandScenarioData: BrandScenarioData | null
  onBack: () => void
  onNext: (data: StoryboardData) => void
}

export default function TimelineStoryboard({ brandScenarioData, onBack, onNext }: Props) {
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [isGeneratingTimeline, setIsGeneratingTimeline] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [regeneratingImageIndex, setRegeneratingImageIndex] = useState<number | null>(null)

  const [appliedVoiceSettings, setAppliedVoiceSettings] = useState<{
    language: string
    emotion: string
    speed: number
    pitch: number
    cloneVoiceFile: string | null
  } | null>(null)
  const [isVoiceSettingsApplied, setIsVoiceSettingsApplied] = useState(false)

  // Voice settings
  const [language, setLanguage] = useState("ko")
  const [emotion, setEmotion] = useState("cheerful")
  const [speed, setSpeed] = useState([1.0])
  const [pitch, setPitch] = useState([1.0])
  const [cloneVoiceFile, setCloneVoiceFile] = useState<string | null>(null)
  const [playingAudioIndex, setPlayingAudioIndex] = useState<number | null>(null)
  const voiceCloneInputRef = useRef<HTMLInputElement>(null)

  // Style references for each timeline item
  const [hairReference, setHairReference] = useState<string | null>(null)
  const [outfitReference, setOutfitReference] = useState<string | null>(null)
  const [makeupReference, setMakeupReference] = useState<string | null>(null)
  const [hairText, setHairText] = useState("")
  const [outfitText, setOutfitText] = useState("")
  const [makeupText, setMakeupText] = useState("")

  const hairInputRef = useRef<HTMLInputElement>(null)
  const outfitInputRef = useRef<HTMLInputElement>(null)
  const makeupInputRef = useRef<HTMLInputElement>(null)

  const handleVoiceCloneUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setCloneVoiceFile(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleStyleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (value: string | null) => void) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setter(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGenerateTimeline = async () => {
    setIsGeneratingTimeline(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const generatedTimeline: TimelineItem[] = [
      {
        timestamp: "0:00 - 0:05",
        scene: "오프닝: 지지가 화면에 등장하며 밝게 인사",
        dialogue: "안녕하세요! 여러분의 뷰티 파트너, 지지입니다.",
        gigiImage: "/smiling-ai-influencer-greeting.jpg",
        voiceType: "gigi",
      },
      {
        timestamp: "0:05 - 0:10",
        scene: `제품 소개: ${brandScenarioData?.brandName} 신제품을 손에 들고 소개`,
        dialogue: `오늘은 ${brandScenarioData?.brandName}의 특별한 신제품을 소개해드릴게요.`,
        gigiImage: "/ai-influencer-holding-beauty-product.jpg",
        voiceType: "gigi",
      },
      {
        timestamp: "0:10 - 0:15",
        scene: "제품 특징 강조: 제품의 주요 성분과 효과를 설명",
        dialogue: "피부에 깊은 수분을 전달하고, 자연스러운 광채를 선사합니다.",
        gigiImage: "/ai-influencer-explaining-product-benefits.jpg",
        voiceType: "gigi",
      },
      {
        timestamp: "0:15 - 0:20",
        scene: "사용법 시연: 제품 사용 방법을 보여줌",
        dialogue: "이렇게 부드럽게 펴 발라주시면 됩니다.",
        gigiImage: "/ai-influencer-demonstrating-product-application.jpg",
        voiceType: "gigi",
      },
      {
        timestamp: "0:20 - 0:25",
        scene: "효과 강조: 사용 후 피부의 변화를 설명",
        dialogue: "즉각적으로 촉촉하고 생기있는 피부를 느끼실 수 있어요.",
        gigiImage: "/ai-influencer-showing-glowing-skin.jpg",
        voiceType: "gigi",
      },
      {
        timestamp: "0:25 - 0:30",
        scene: "클로징: 따뜻한 미소로 시청자들에게 인사",
        dialogue: "여러분의 아름다움을 응원합니다. 감사합니다!",
        gigiImage: "/ai-influencer-waving-goodbye-with-smile.jpg",
        voiceType: "gigi",
      },
    ]

    setTimeline(generatedTimeline)
    setIsGeneratingTimeline(false)
  }

  const handleStyleScene = (index: number) => {
    setEditingIndex(index)
    // Reset style inputs
    setHairReference(timeline[index].hairReference || null)
    setOutfitReference(timeline[index].outfitReference || null)
    setMakeupReference(timeline[index].makeupReference || null)
    setHairText(timeline[index].hairText || "")
    setOutfitText(timeline[index].outfitText || "")
    setMakeupText(timeline[index].makeupText || "")
  }

  const handleGenerateSceneImage = async () => {
    if (editingIndex === null) return

    setRegeneratingImageIndex(editingIndex)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const updatedTimeline = [...timeline]
    const sceneDescription = updatedTimeline[editingIndex].scene
    updatedTimeline[editingIndex] = {
      ...updatedTimeline[editingIndex],
      gigiImage: `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(sceneDescription + " " + hairText + " " + outfitText + " " + makeupText)}-${Date.now()}`,
      hairReference: hairReference || undefined,
      outfitReference: outfitReference || undefined,
      makeupReference: makeupReference || undefined,
      hairText: hairText || undefined,
      outfitText: outfitText || undefined,
      makeupText: makeupText || undefined,
    }
    setTimeline(updatedTimeline)
    setRegeneratingImageIndex(null)
    setEditingIndex(null)
  }

  const handlePlayAudio = async (index: number) => {
    setPlayingAudioIndex(index)
    const settingsToUse = appliedVoiceSettings || {
      language,
      emotion,
      speed: speed[0],
      pitch: pitch[0],
      cloneVoiceFile,
    }
    const voiceType = timeline[index].voiceType || "gigi"
    console.log("[v0] Playing audio for timeline", index, "with settings:", {
      ...settingsToUse,
      cloneVoiceFile: settingsToUse.cloneVoiceFile ? "uploaded" : "none",
      text: timeline[index].dialogue,
      voiceType,
    })
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setPlayingAudioIndex(null)
  }

  const handleApplyVoiceSettings = () => {
    setAppliedVoiceSettings({
      language,
      emotion,
      speed: speed[0],
      pitch: pitch[0],
      cloneVoiceFile,
    })
    setIsVoiceSettingsApplied(true)

    // Reset confirmation after 2 seconds
    setTimeout(() => {
      setIsVoiceSettingsApplied(false)
    }, 2000)
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
              <h2 className="text-2xl font-semibold mb-4">타임라인 생성</h2>
              <p className="text-muted-foreground mb-6">30초 영상을 위한 상세 타임라인을 생성합니다 (5초 간격)</p>
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
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Left Column - Image */}
                  <div className="relative">
                    <div className="aspect-video rounded-lg overflow-hidden bg-muted border-2 border-border">
                      {item.gigiImage ? (
                        <img
                          src={item.gigiImage || "/placeholder.svg"}
                          alt={`Scene ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-muted-foreground" />
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

                  {/* Right Column - Scene Info and Styling */}
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
                      <div className="text-sm text-muted-foreground mb-1">장면</div>
                      <div className="font-medium">{item.scene}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">대사</div>
                      <div className="text-foreground">&ldquo;{item.dialogue}&rdquo;</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">음성 유형 선택</div>
                      <div className="flex gap-2 mb-3">
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

                    {editingIndex === index && (
                      <div className="pt-4 border-t border-border space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-semibold">장면 {index + 1} - 지지 스타일 설정</h3>
                          {index > 0 && (
                            <Button
                              onClick={() => {
                                const prevItem = timeline[index - 1]
                                if (prevItem.gigiStyle) {
                                  setHairText(prevItem.gigiStyle.hairText || "")
                                  setOutfitText(prevItem.gigiStyle.outfitText || "")
                                  setMakeupText(prevItem.gigiStyle.makeupText || "")
                                  setHairReference(prevItem.gigiStyle.hairReference || null)
                                  setOutfitReference(prevItem.gigiStyle.outfitReference || null)
                                  setMakeupReference(prevItem.gigiStyle.makeupReference || null)
                                }
                              }}
                              variant="outline"
                              size="sm"
                            >
                              <Copy className="mr-2 h-3 w-3" />
                              이전 스타일 복사
                            </Button>
                          )}
                        </div>

                        <div className="space-y-3">
                          {/* Hair Style */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">머리 스타일</Label>
                            <Input
                              placeholder="예: 웨이브가 있는 긴 머리"
                              value={hairText}
                              onChange={(e) => setHairText(e.target.value)}
                              className="text-sm"
                            />
                            <input
                              ref={hairInputRef}
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleStyleFileUpload(e, setHairReference)}
                              className="hidden"
                            />
                            {hairReference ? (
                              <div className="relative w-full aspect-video rounded overflow-hidden border">
                                <img
                                  src={hairReference || "/placeholder.svg"}
                                  alt="Hair"
                                  className="w-full h-full object-cover"
                                />
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

                          {/* Outfit Style */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">옷 스타일</Label>
                            <Input
                              placeholder="예: 검정 드레스"
                              value={outfitText}
                              onChange={(e) => setOutfitText(e.target.value)}
                              className="text-sm"
                            />
                            <input
                              ref={outfitInputRef}
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleStyleFileUpload(e, setOutfitReference)}
                              className="hidden"
                            />
                            {outfitReference ? (
                              <div className="relative w-full aspect-video rounded overflow-hidden border">
                                <img
                                  src={outfitReference || "/placeholder.svg"}
                                  alt="Outfit"
                                  className="w-full h-full object-cover"
                                />
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

                          {/* Makeup Style */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">메이크업</Label>
                            <Input
                              placeholder="예: 선명한 레드 립"
                              value={makeupText}
                              onChange={(e) => setMakeupText(e.target.value)}
                              className="text-sm"
                            />
                            <input
                              ref={makeupInputRef}
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleStyleFileUpload(e, setMakeupReference)}
                              className="hidden"
                            />
                            {makeupReference ? (
                              <div className="relative w-full aspect-video rounded overflow-hidden border">
                                <img
                                  src={makeupReference || "/placeholder.svg"}
                                  alt="Makeup"
                                  className="w-full h-full object-cover"
                                />
                                <Button
                                  onClick={() => setMakeupReference(null)}
                                  size="icon"
                                  variant="destructive"
                                  className="absolute top-1 right-1 h-6 w-6"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                onClick={() => makeupInputRef.current?.click()}
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
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Voice Settings */}
        {timeline.length > 0 && (
          <Card className="p-8">
            <h2 className="text-2xl font-semibold mb-6">음성 설정</h2>
            <p className="text-sm text-muted-foreground mb-4">
              음성 설정을 변경한 후 "음성 설정 적용" 버튼을 클릭하면 타임라인의 "음성 듣기"가 새로운 설정으로
              재생됩니다.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="language" className="text-base font-semibold">
                    언어
                  </Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ko">한국어</SelectItem>
                      <SelectItem value="en">영어</SelectItem>
                      <SelectItem value="ja">일본어</SelectItem>
                      <SelectItem value="zh">중국어</SelectItem>
                      <SelectItem value="fr">프랑스어</SelectItem>
                      <SelectItem value="de">독일어</SelectItem>
                      <SelectItem value="es">스페인어</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emotion" className="text-base font-semibold">
                    감정
                  </Label>
                  <Select value={emotion} onValueChange={setEmotion}>
                    <SelectTrigger id="emotion">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="neutral">차분함</SelectItem>
                      <SelectItem value="cheerful">밝고 활기찬</SelectItem>
                      <SelectItem value="warm">따뜻한</SelectItem>
                      <SelectItem value="professional">전문적인</SelectItem>
                      <SelectItem value="friendly">친근한</SelectItem>
                      <SelectItem value="excited">열정적인</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">말하기 속도</Label>
                    <span className="text-sm font-medium text-primary">{speed[0].toFixed(1)}x</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">느리게</span>
                    <Slider value={speed} onValueChange={setSpeed} min={0.5} max={2.0} step={0.1} className="flex-1" />
                    <span className="text-xs text-muted-foreground">빠르게</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">음높이</Label>
                    <span className="text-sm font-medium text-primary">{pitch[0].toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">낮음</span>
                    <Slider value={pitch} onValueChange={setPitch} min={0.5} max={1.5} step={0.1} className="flex-1" />
                    <span className="text-xs text-muted-foreground">높음</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">음성 복제 (선택)</Label>
                  <p className="text-sm text-muted-foreground">참고할 음성 파일을 업로드하세요.</p>
                  <input
                    ref={voiceCloneInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleVoiceCloneUpload}
                    className="hidden"
                  />
                  {cloneVoiceFile ? (
                    <div className="flex items-center gap-2 p-4 bg-muted/30 rounded-lg">
                      <Volume2 className="h-5 w-5 text-primary" />
                      <span className="text-sm flex-1">음성 파일 업로드됨</span>
                      <Button onClick={() => setCloneVoiceFile(null)} size="sm" variant="ghost">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => voiceCloneInputRef.current?.click()}
                      variant="outline"
                      className="w-full h-20 border-dashed"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <Upload className="h-5 w-5" />
                        <span>음성 파일 업로드</span>
                      </div>
                    </Button>
                  )}
                </div>
                <Card className="p-4 bg-muted/30">
                  <div className="flex items-start gap-3">
                    <Volume2 className="h-5 w-5 text-primary mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-medium text-sm">음성 설정 요약</div>
                      <div className="text-xs text-muted-foreground">
                        {language === "ko"
                          ? "한국어"
                          : language === "en"
                            ? "영어"
                            : language === "ja"
                              ? "일본어"
                              : "중국어"}{" "}
                        | {emotion === "cheerful" ? "밝고 활기찬" : "차분함"} | {speed[0].toFixed(1)}x |{" "}
                        {pitch[0].toFixed(1)}
                        {cloneVoiceFile && " | 음성 복제"}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
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
                    ✓ 음성 설정이 적용되었습니다. 타임라인에서 "음성 듣기"를 눌러 확인하세요.
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-4">
        <Button onClick={onBack} variant="outline" size="lg" className="flex-1 bg-transparent">
          <ChevronLeft className="mr-2 h-5 w-5" />
          이전 단계
        </Button>

        {timeline.length > 0 && (
          <Button
            onClick={() => {
              const voiceText = timeline.map((t) => t.dialogue).join("\n")
              onNext({
                timeline,
                voiceSettings: {
                  text: voiceText,
                  language: appliedVoiceSettings?.language || language,
                  emotion: appliedVoiceSettings?.emotion || emotion,
                  speed: appliedVoiceSettings?.speed || speed[0],
                  pitch: appliedVoiceSettings?.pitch || pitch[0],
                  cloneVoiceFile: appliedVoiceSettings?.cloneVoiceFile || cloneVoiceFile,
                },
              })
            }}
            size="lg"
            className="flex-1"
          >
            비디오 생성하기
            <Sparkles className="ml-2 h-5 w-5" />
          </Button>
        )}

        {timeline.length === 0 && (
          <Button
            onClick={() => {
              const defaultTimeline: TimelineItem[] = [
                {
                  timestamp: "0:00 - 0:30",
                  scene: "기본 시나리오",
                  dialogue: "안녕하세요, 지지입니다.",
                  voiceType: "gigi",
                },
              ]
              onNext({
                timeline: defaultTimeline,
                voiceSettings: {
                  text: "안녕하세요, 지지입니다.",
                  language,
                  emotion,
                  speed: speed[0],
                  pitch: pitch[0],
                },
              })
            }}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            건너뛰기
          </Button>
        )}
      </div>
    </div>
  )
}
