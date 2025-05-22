using Crux.Models.Requests;
using Crux.Models.Responses;

namespace Crux.Services;

public interface IEducationalDataService
{
    EducationalDataResponse AddEducationalData(EducationalCardDataRequest dataRequest);
    Task<EducationalDataResponse> AddEducationalDataAsync(EducationalCardDataRequest dataRequest);
    
    EducationalDataResponse GetEducationalData(int id);
    Task<EducationalDataResponse> GetEducationalDataAsync(int id);
    
    EducationalDataResponse UpdateEducationalData(EducationalCardDataRequest dataRequest);
    Task<EducationalDataResponse> UpdateEducationalDataAsync(EducationalCardDataRequest dataRequest);

    bool DeleteEducationalCardFiles(int cardId);
}
