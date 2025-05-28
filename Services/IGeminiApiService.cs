using Crux.Models.Responses;

namespace Crux.Services;

public interface IGeminiApiService
{
    Task<string> SummarizeContentAsync(string content, int maxWords = 50);
    
    Task<string> GenerateDescriptionAsync(string title, string snippet);
    
    Task<List<string>> GenerateSearchSuggestionsAsync(string topic);
    
    Task<string> TranslateTextAsync(string text, string language);
    
    Task<string> AnalyzeSentimentAsync(string text);
    
    Task<string> ExtractKeyPointsAsync(string content);
    
    Task<UserFeedResponse> EnhanceSearchResultAsync(UserFeedResponse result);
}
