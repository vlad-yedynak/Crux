using Crux.Models.Requests;
using Crux.Models.Responses;

namespace Crux.Services;

public interface IEducationalDataService
{
    Task<EducationalDataResponse> AddEducationalDataAsync(EducationalCardDataRequest dataRequest);
    
    EducationalDataResponse GetEducationalData(int id);
    Task<EducationalDataResponse> GetEducationalDataAsync(int id);
    
    Task<EducationalDataResponse> UpdateEducationalDataAsync(EducationalCardDataRequest dataRequest);

    Task<bool> DeleteEducationalCardFilesAsync(int cardId);
}
