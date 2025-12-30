"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Sparkles, RefreshCw, Upload, X } from "lucide-react"
import type { StyleData } from "@/app/page"

type Props = {
  onNext: (data: StyleData) => void
}

export default function StyleGenerator({ onNext }: Props) {
  const defaultHairStyle = "긴 생머리 스타일"
  const defaultOutfitStyle = "우아한 화이트 원피스"
  const defaultMakeupStyle = "자연스러운 누드 메이크업"

  const [hairReference, setHairReference] = useState<string | null>(null)
  const [outfitReference, setOutfitReference] = useState<string | null>(null)
  const [makeupReference, setMakeupReference] = useState<string | null>(null)

  const [hairText, setHairText] = useState("")
  const [outfitText, setOutfitText] = useState("")
  const [makeupText, setMakeupText] = useState("")

  const [selectedBrand, setSelectedBrand] = useState("")
  const [customBrand, setCustomBrand] = useState("")
  const [brandConcept, setBrandConcept] = useState("")
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const hairInputRef = useRef<HTMLInputElement>(null)
  const outfitInputRef = useRef<HTMLInputElement>(null)
  const makeupInputRef = useRef<HTMLInputElement>(null)

  const amoreBrands = [
    "설화수 (Sulwhasoo)",
    "라네즈 (LANEIGE)",
    "마몽드 (MAMONDE)",
    "이니스프리 (innisfree)",
    "에뛰드 (ETUDE)",
    "직접 입력",
  ]

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (value: string | null) => void) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setter(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    // Simulate API call - replace with actual AI image generation
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setGeneratedImage(
      `/placeholder.svg?height=600&width=400&query=Korean AI influencer Gigi with custom hair outfit and makeup style for ${selectedBrand === "직접 입력" ? customBrand : selectedBrand}`,
    )
    setIsGenerating(false)
  }

  const handleRegenerate = () => {
    handleGenerate()
  }

  const canGenerate = (selectedBrand && selectedBrand !== "직접 입력") || (selectedBrand === "직접 입력" && customBrand)

  return (
    <div className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">지지의 스타일 생성</h1>
        <p className="text-muted-foreground text-lg">브랜드를 선택하고, 원하는 스타일 레퍼런스를 업로드하세요</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Reference Image Uploads and Brand Selection */}
        <div className="space-y-6">
          <Card className="p-8 space-y-6">
            <h3 className="text-lg font-semibold">브랜드 선택</h3>
            <div className="space-y-2">
              <Label htmlFor="brand" className="text-base">
                브랜드 <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger id="brand">
                  <SelectValue placeholder="브랜드를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {amoreBrands.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedBrand === "직접 입력" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="custom-brand" className="text-base">
                    브랜드 이름 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="custom-brand"
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    placeholder="브랜드 이름을 입력하세요"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="concept" className="text-base">
                    브랜드 컨셉 / 분위기 (선택)
                  </Label>
                  <Textarea
                    id="concept"
                    value={brandConcept}
                    onChange={(e) => setBrandConcept(e.target.value)}
                    placeholder="브랜드의 톤앤매너, 타겟 고객, 주요 메시지 등을 입력하세요"
                    rows={3}
                  />
                </div>
              </>
            )}
          </Card>

          <Card className="p-8 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-1">스타일 레퍼런스 (선택)</h3>
              <p className="text-sm text-muted-foreground">
                기본 스타일이 적용되며, 원하시면 레퍼런스 이미지나 텍스트로 변경할 수 있습니다
              </p>
            </div>

            {/* Hair Reference */}
            <div className="space-y-2">
              <Label className="text-base">
                머리 스타일 <span className="text-xs text-muted-foreground">(기본: {defaultHairStyle})</span>
              </Label>

              <Input
                placeholder="예: 웨이브가 있는 긴 머리, 포니테일 등"
                value={hairText}
                onChange={(e) => setHairText(e.target.value)}
                disabled={generatedImage !== null}
              />

              <input
                ref={hairInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, setHairReference)}
                className="hidden"
                disabled={generatedImage !== null}
              />
              {hairReference ? (
                <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-primary">
                  <img
                    src={hairReference || "/placeholder.svg"}
                    alt="Hair reference"
                    className="w-full h-full object-cover"
                  />
                  {!generatedImage && (
                    <Button
                      onClick={() => setHairReference(null)}
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ) : (
                <Button
                  onClick={() => hairInputRef.current?.click()}
                  variant="outline"
                  className="w-full h-20 border-dashed"
                  disabled={generatedImage !== null}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-5 w-5" />
                    <span className="text-sm">또는 이미지 업로드</span>
                  </div>
                </Button>
              )}
            </div>

            {/* Outfit Reference */}
            <div className="space-y-2">
              <Label className="text-base">
                옷 스타일 <span className="text-xs text-muted-foreground">(기본: {defaultOutfitStyle})</span>
              </Label>

              <Input
                placeholder="예: 검정 드레스, 캐주얼한 청바지 등"
                value={outfitText}
                onChange={(e) => setOutfitText(e.target.value)}
                disabled={generatedImage !== null}
              />

              <input
                ref={outfitInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, setOutfitReference)}
                className="hidden"
                disabled={generatedImage !== null}
              />
              {outfitReference ? (
                <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-primary">
                  <img
                    src={outfitReference || "/placeholder.svg"}
                    alt="Outfit reference"
                    className="w-full h-full object-cover"
                  />
                  {!generatedImage && (
                    <Button
                      onClick={() => setOutfitReference(null)}
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ) : (
                <Button
                  onClick={() => outfitInputRef.current?.click()}
                  variant="outline"
                  className="w-full h-20 border-dashed"
                  disabled={generatedImage !== null}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-5 w-5" />
                    <span className="text-sm">또는 이미지 업로드</span>
                  </div>
                </Button>
              )}
            </div>

            {/* Makeup Reference */}
            <div className="space-y-2">
              <Label className="text-base">
                메이크업 <span className="text-xs text-muted-foreground">(기본: {defaultMakeupStyle})</span>
              </Label>

              <Input
                placeholder="예: 선명한 레드 립, 스모키 아이 등"
                value={makeupText}
                onChange={(e) => setMakeupText(e.target.value)}
                disabled={generatedImage !== null}
              />

              <input
                ref={makeupInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, setMakeupReference)}
                className="hidden"
                disabled={generatedImage !== null}
              />
              {makeupReference ? (
                <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-primary">
                  <img
                    src={makeupReference || "/placeholder.svg"}
                    alt="Makeup reference"
                    className="w-full h-full object-cover"
                  />
                  {!generatedImage && (
                    <Button
                      onClick={() => setMakeupReference(null)}
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ) : (
                <Button
                  onClick={() => makeupInputRef.current?.click()}
                  variant="outline"
                  className="w-full h-20 border-dashed"
                  disabled={generatedImage !== null}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-5 w-5" />
                    <span className="text-sm">또는 이미지 업로드</span>
                  </div>
                </Button>
              )}
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating}
              className="w-full h-12 text-base"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  지지 이미지 생성
                </>
              )}
            </Button>
          </Card>
        </div>

        {/* Preview Area */}
        <div className="space-y-4">
          <Card className="aspect-[2/3] flex items-center justify-center bg-muted/30 overflow-hidden">
            {generatedImage ? (
              <img
                src={generatedImage || "/placeholder.svg"}
                alt="Generated Gigi"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-8">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">브랜드를 선택하고 생성하세요</p>
                <p className="text-sm text-muted-foreground mt-2">스타일은 기본값으로 설정됩니다</p>
              </div>
            )}
          </Card>

          {generatedImage && (
            <div className="flex gap-3">
              <Button
                onClick={handleRegenerate}
                variant="outline"
                className="flex-1 bg-transparent"
                disabled={isGenerating}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                재생성
              </Button>
              <Button
                onClick={() =>
                  onNext({
                    hairReference: hairReference || undefined,
                    outfitReference: outfitReference || undefined,
                    makeupReference: makeupReference || undefined,
                    hairText: hairText || undefined,
                    outfitText: outfitText || undefined,
                    makeupText: makeupText || undefined,
                    generatedImage,
                    brandName: selectedBrand === "직접 입력" ? customBrand : selectedBrand,
                    brandConcept: brandConcept || undefined,
                  })
                }
                className="flex-1"
              >
                다음 단계
              </Button>
            </div>
          )}

          {!generatedImage && canGenerate && (
            <Button
              onClick={() =>
                onNext({
                  generatedImage: "/default-gigi-style.jpg",
                  brandName: selectedBrand === "직접 입력" ? customBrand : selectedBrand,
                  brandConcept: brandConcept || undefined,
                })
              }
              variant="outline"
              className="w-full"
            >
              건너뛰기 (기본 스타일 사용)
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
