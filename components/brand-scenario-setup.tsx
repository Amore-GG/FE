"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Sparkles, RefreshCw, AlertCircle } from "lucide-react"
import type { BrandScenarioData } from "@/app/page"

const API_BASE_URL = "https://gigicreation.store/api/scenario"

type Props = {
  onNext: (data: BrandScenarioData) => void
}

// 기본 브랜드 목록 (API 실패 시 폴백)
const DEFAULT_BRANDS = ["이니스프리", "에뛰드", "라네즈", "설화수", "헤라"]

export default function BrandScenarioSetup({ onNext }: Props) {
  const [selectedBrand, setSelectedBrand] = useState("")
  const [userPrompt, setUserPrompt] = useState("")
  const [scenario, setScenario] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  // 기본값으로 초기화하여 즉시 표시
  const [brands, setBrands] = useState<string[]>(DEFAULT_BRANDS)
  const [isLoadingBrands, setIsLoadingBrands] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 브랜드 목록 가져오기 (백그라운드에서 API 시도)
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/brands`)
        
        if (!response.ok) {
          return // 실패 시 기본값 유지
        }
        
        const data = await response.json()
        console.log("브랜드 목록 응답:", data)
        
        // 응답 형식에 따라 처리
        if (Array.isArray(data.brands) && data.brands.length > 0) {
          setBrands(data.brands)
        } else if (Array.isArray(data) && data.length > 0) {
          setBrands(data)
        }
        // 빈 응답이면 기본값 유지
      } catch {
        // API 실패 시 기본값 유지 (이미 설정됨)
        console.log("브랜드 API 연결 실패, 기본값 사용")
      }
    }

    fetchBrands()
  }, [])

  const handleGenerateScenario = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const requestBody: {
        brand: string
        user_query?: string
        temperature?: number
      } = {
        brand: selectedBrand,
      }

      if (userPrompt.trim()) {
        requestBody.user_query = userPrompt
      }

      console.log("시나리오 생성 요청:", {
        url: `${API_BASE_URL}/generate`,
        body: requestBody
      })

      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("시나리오 API 오류:", response.status, errorText)
        throw new Error(`시나리오 생성 실패: ${response.status}`)
      }

      const data = await response.json()

      // API 응답: { scenario: "...", brand: "...", query: "..." }
      if (data.scenario) {
        setScenario(data.scenario)
      } else {
        throw new Error("시나리오 응답 형식이 올바르지 않습니다.")
      }
    } catch (err) {
      console.error("시나리오 생성 실패:", err)
      setError("시나리오 생성에 실패했습니다. 다시 시도해주세요.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerateScenario = () => {
    setScenario(null)
    handleGenerateScenario()
  }

  const canGenerate = selectedBrand.length > 0

  return (
    <div className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">브랜드 & 시나리오 설정</h1>
        <p className="text-muted-foreground text-lg">브랜드를 선택하고 영상 시나리오를 생성하세요</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="p-8 space-y">
            <h3 className="text-lg font-semibold">브랜드 선택</h3>
            <div className="space-y-2">
              <Label htmlFor="brand" className="text-base">
                브랜드 <span className="text-destructive">*</span>
              </Label>
              <Select 
                value={selectedBrand} 
                onValueChange={setSelectedBrand}
                disabled={isLoadingBrands}
              >
                <SelectTrigger id="brand">
                  <SelectValue placeholder={isLoadingBrands ? "브랜드 목록 로딩 중..." : "브랜드를 선택하세요"} />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </Card>

          <Card className="p-8 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-1">시나리오 프롬프트 (선택)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                원하는 시나리오 방향과 제품 소개 내용이 있다면 입력하세요.
              </p>
              <Textarea
                placeholder="예: 설화수의 자음생수의 효과를 강조하며 젊은 층에게 어필하는 내용으로..."
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                rows={4}
                className="resize-none"
              />
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
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="relative mb-6">
                  <div className="w-16 h-16 border-4 border-muted rounded-full"></div>
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                </div>
                <h3 className="text-lg font-semibold mb-2">시나리오 생성 중</h3>
                <p className="text-muted-foreground text-sm">AI가 브랜드에 맞는 시나리오를 작성하고 있습니다...</p>
              </div>
            ) : scenario ? (
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
                  brandName: selectedBrand,
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

        </div>
      </div>
    </div>
  )
}
