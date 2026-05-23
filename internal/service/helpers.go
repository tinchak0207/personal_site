package service

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"net/url"
	"strings"
	"time"
)

// randNumeric 生成指定长度的随机数字字符串。
func randNumeric(length int) string {
	if length <= 0 {
		return ""
	}
	var b strings.Builder
	for i := 0; i < length; i++ {
		n, err := rand.Int(rand.Reader, big.NewInt(10))
		if err != nil {
			b.WriteString("0")
			continue
		}
		fmt.Fprintf(&b, "%d", n.Int64())
	}
	return b.String()
}

// generateSerialNo 生成带前缀的流水号（前缀 + 时间戳 + 随机数字）。
func generateSerialNo(prefix string) string {
	now := time.Now().Format("20060102150405")
	return fmt.Sprintf("%s%s%s", prefix, now, randNumeric(6))
}

// pickFirstNonEmpty 返回第一个非空（trim 后）的字符串。
func pickFirstNonEmpty(values ...string) string {
	for _, val := range values {
		trimmed := strings.TrimSpace(val)
		if trimmed != "" {
			return trimmed
		}
	}
	return ""
}

// appendURLQuery 向 URL 追加查询参数。
func appendURLQuery(rawURL string, params map[string]string) string {
	rawURL = strings.TrimSpace(rawURL)
	if rawURL == "" {
		return ""
	}
	parsed, err := url.Parse(rawURL)
	if err != nil {
		return rawURL
	}
	query := parsed.Query()
	for key, value := range params {
		key = strings.TrimSpace(key)
		value = strings.TrimSpace(value)
		if key == "" || value == "" {
			continue
		}
		query.Set(key, value)
	}
	parsed.RawQuery = query.Encode()
	return parsed.String()
}
