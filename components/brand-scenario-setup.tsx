"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Sparkles, Upload, X, RefreshCw } from "lucide-react"
import type { BrandScenarioData } from "@/app/page"

type Props = {
  onNext: (data: BrandScenarioData) => void
}

export default function BrandScenarioSetup({ onNext }: Props) {
  const [selectedBrand, setSelectedBrand] = useState("")
  const [customBrand, setCustomBrand] = useState("")
  const [brandConcept, setBrandConcept] = useState("")
  const [userPrompt, setUserPrompt] = useState("")
  const [productImage, setProductImage] = useState<string | null>(null)
  const [scenario, setScenario] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const productInputRef = useRef<HTMLInputElement>(null)

  const amoreBrands = [
    "설화수 (Sulwhasoo)",
    "라네즈 (LANEIGE)",
    "마몽드 (MAMONDE)",
    "이니스프리 (innisfree)",
    "에뛰드 (ETUDE)",
    "직접 입력",
  ]

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProductImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGenerateScenario = async () => {
    setIsGenerating(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const brandName = selectedBrand === "직접 입력" ? customBrand : selectedBrand
    const generatedScenario = userPrompt
      ? `${userPrompt}\n\n${brandName}의 톤앤매너를 반영하여 지지가 ${userPrompt}를 자연스럽게 전달합니다. 제품의 주요 특징과 혜택을 강조하면서, 시청자들과 친근하게 소통합니다. 마지막에는 브랜드의 핵심 메시지를 전달하며 따뜻한 미소로 마무리합니다.`
      : `${brandName}의 신제품을 소개하는 지지의 모습으로 시작됩니다. 지지는 화면을 향해 환하게 웃으며 제품을 자연스럽게 소개합니다. 제품의 주요 특징과 혜택을 강조하면서, 시청자들과 친근하게 소통합니다. 마지막에는 브랜드의 핵심 메시지를 전달하며 따뜻한 미소로 마무리합니다.`

    setScenario(generatedScenario)
    setIsGenerating(false)
  }

  const handleRegenerateScenario = () => {
    setScenario(null)
    handleGenerateScenario()
  }

  const canGenerate = (selectedBrand && selectedBrand !== "직접 입력") || (selectedBrand === "직접 입력" && customBrand)

  return (
    <div className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">브랜드 & 시나리오 설정</h1>
        <p className="text-muted-foreground text-lg">브랜드를 선택하고 영상 시나리오를 생성하세요</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
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
              <h3 className="text-lg font-semibold mb-1">시나리오 프롬프트 (선택)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                원하는 시나리오 방향이 있다면 입력하세요. 비워두면 자동 생성됩니다.
              </p>
              <Textarea
                placeholder="예: 신제품의 혁신적인 기술력을 강조하며 젊은 층에게 어필하는 내용으로..."
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-1">제품 사진 (선택)</h3>
              <p className="text-sm text-muted-foreground mb-4">영상에 포함할 제품 사진을 업로드할 수 있습니다.</p>
              <input
                ref={productInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              {productImage ? (
                <div className="relative w-48 aspect-square rounded-lg overflow-hidden border-2 border-primary">
                  <img src={productImage || "/placeholder.svg"} alt="Product" className="w-full h-full object-cover" />
                  <Button
                    onClick={() => setProductImage(null)}
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => productInputRef.current?.click()}
                  variant="outline"
                  className="w-full h-32 border-dashed"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-6 w-6" />
                    <span>제품 사진 업로드</span>
                    <span className="text-xs text-muted-foreground">선택사항</span>
                  </div>
                </Button>
              )}
            </div>

            {!scenario ? (
              <Button
                onClick={handleGenerateScenario}
                disabled={!canGenerate || isGenerating}
                className="w-full"
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
                    시나리오 생성
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleRegenerateScenario}
                disabled={isGenerating}
                variant="outline"
                className="w-full bg-transparent"
                size="lg"
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                시나리오 재생성
              </Button>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-8 min-h-[400px]">
            {scenario ? (
              <div>
                <h3 className="text-xl font-semibold mb-4">생성된 시나리오</h3>
                <div className="bg-muted/30 rounded-lg p-6">
                  <p className="text-base leading-relaxed whitespace-pre-line">{scenario}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Sparkles className="w-16 h-16 mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">브랜드를 선택하고 시나리오를 생성하세요</p>
              </div>
            )}
          </Card>

          {scenario && (
            <Button
              onClick={() =>
                onNext({
                  brandName: selectedBrand === "직접 입력" ? customBrand : selectedBrand,
                  brandConcept: brandConcept || undefined,
                  productImage: productImage || undefined,
                  userPrompt: userPrompt || undefined,
                  scenario,
                })
              }
              className="w-full"
              size="lg"
            >
              다음 단계 (타임라인 생성)
            </Button>
          )}

          {canGenerate && !scenario && (
            <Button
              onClick={() =>
                onNext({
                  brandName: selectedBrand === "직접 입력" ? customBrand : selectedBrand,
                  brandConcept: brandConcept || undefined,
                  productImage: productImage || undefined,
                })
              }
              variant="outline"
              className="w-full"
            >
              건너뛰기 (기본 시나리오 사용)
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
