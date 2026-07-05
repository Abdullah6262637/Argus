"""ToolRegistry: tum tool'lari kayit eder, izin filtresi uygular ve cagrir.

LLM'e gonderilen 'tools' listesi, agent'in AgentPermissions'una gore filtrelenir.
Mesela 'web_search=False' olan ajan 'web_search' tool'unu goremez.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, List, Optional

from app.schemas.agent import AgentPermissions
from app.services.tools.base import BaseTool, PermissionKey, ToolContext, ToolResult
from app.services.tools.browser_tools import OpenUrlTool, WebSearchTool
from app.services.tools.clipboard_tools import ClipboardGetTool, ClipboardSetTool
from app.services.tools.code_tools import (
    EvaluateMathTool,
    PythonEvalTool,
    RegexMatchTool,
)
from app.services.tools.file_extra_tools import (
    CopyFileTool,
    DeleteFileTool,
    MkdirTool,
    MoveFileTool,
    SearchFilesTool,
    UnzipTool,
    ZipTool,
)
from app.services.tools.file_tools import (
    AppendFileTool,
    ListDirTool,
    ReadFileTool,
    WriteFileTool,
)
from app.services.tools.media_tools import (
    PlayBeepTool,
    ShowNotificationTool,
    TextToSpeechTool,
)
from app.services.tools.memory_tools import (
    DeleteMemoryTool,
    ListMemoryTool,
    RecallMemoryTool,
    SaveMemoryTool,
)
from app.services.tools.network_tools import (
    DownloadFileTool,
    HttpRequestTool,
    PingHostTool,
)
from app.services.tools.process_tools import KillProcessTool, ListProcessesTool
from app.services.tools.system_extra_tools import (
    CancelShutdownTool,
    GetDateTimeTool,
    LockScreenTool,
    SetVolumeTool,
    ShutdownTool,
)
from app.services.tools.system_tools import OpenAppTool, RunCommandTool, SystemInfoTool
from app.services.tools.ui_tools import (
    ClickTool,
    KeyPressTool,
    MouseMoveTool,
    ScreenshotTool,
    TypeTextTool,
)
from app.services.tools.window_tools import (
    CloseWindowTool,
    FocusWindowTool,
    ListWindowsTool,
    MaximizeWindowTool,
    MinimizeWindowTool,
)
# v2: yeni tool'lar (FAZ 2/3/4)
from app.services.tools.agent_tools import DelegateToAgentTool, AgentWaitForApprovalTool, BlackboardSetTool, BlackboardGetTool
from app.services.tools.new_twenty_tools import (
    InteractiveBrowserClickTool,
    InteractiveBrowserTypeTool,
    InteractiveBrowserScrollTool,
    WebPDFGeneratorTool,
    SandboxExecutePythonTool,
    SandboxExecuteJSTool,
    SandboxInstallPackageTool,
    GenericAPIRequestTool,
    GoogleCalendarManageTool,
    GoogleSheetsSyncTool,
    NotionPagesManageTool,
    JiraTicketCreateTool,
    GitHubPullRequestManageTool,
    SpeechToTextFileTool,
    ImageOCRReadTool,
    VectorDatabaseSearchTool,
    DocumentSummarizerHeavyTool,
    AgentAskUserQuestionTool,
    AgentSleepTool,
)
from app.services.tools.browser_auto import (
    BrowserClickTool,
    BrowserFillTool,
    BrowserGetTextTool,
    BrowserNavigateTool,
    BrowserScreenshotTool,
    ReadWebpageTool,
)
from app.services.tools.web_reader_tool import ReadWebpageMarkdownTool
from app.services.tools.dependency_tool import InstallProjectDependencyTool
from app.services.tools.document_tools import ReadDocumentTool
from app.services.tools.github_api_tool import GitHubAPITool
from app.services.tools.docker_sandbox_tool import DockerSandboxRunTool
from app.services.tools.doc_layout_tool import ParseLayoutDocumentTool
from app.services.tools.vector_tools import (
    IngestDocumentTool,
    KGAddEntityTool,
    KGAddRelationTool,
    KGQueryNeighborsTool,
    KGSearchTool,
    VectorSearchTool,
    VectorUpsertTool,
)
# v3 (Sprint 3): yeni tool aileleri
from app.services.tools.git_tools import (
    GitBranchListTool,
    GitBranchSwitchTool,
    GitCloneTool,
    GitCommitTool,
    GitDiffTool,
    GitInitTool,
    GitLogTool,
    GitPullTool,
    GitPushTool,
    GitStatusTool,
)
from app.services.tools.email_tools import EmailReadInboxTool, EmailSendTool
from app.services.tools.database_tools import (
    DBExecuteTool,
    DBQueryTool,
    DBSchemaTool,
)
from app.services.tools.image_tools import ImageGenerateTool
from app.services.tools.document_writer_tools import PDFGenerateTool, XLSXWriteTool
from app.services.tools.messaging_tools import (
    DiscordSendTool,
    SlackSendTool,
    TelegramSendTool,
)
# Sprint D: Yeni tool aileleri
from app.services.tools.research_tools import (
    ArxivSearchTool,
    WikipediaLookupTool,
    YoutubeSearchTool,
    YoutubeTranscriptTool,
)
from app.services.tools.document_extra_tools import (
    MarkdownToHtmlTool,
    PDFMergeTool,
    PDFSplitTool,
    PPTXGenerateTool,
)
from app.services.tools.security_tools import (
    DNSLookupTool,
    PortScanTool,
    SSLCertCheckTool,
    WhoisQueryTool,
)
from app.services.tools.devops_tools import (
    DockerBuildTool,
    DockerLogsTool,
    DockerPsTool,
    DockerRunTool,
    KubectlApplyTool,
    KubectlGetTool,
    KubectlLogsTool,
)
# FAZ 1: AI & ML Tools
from app.services.tools.ai_ml_tools import (
    BugDetectionTool,
    CodeExplanationTool,
    CodeGenerationTool,
    DataValidationRulesTool,
    DocumentationGenerateTool,
    HuggingfaceInferenceTool,
    OpenAIEmbeddingTool,
    OpenAIModerationTool,
    ParaphraseTextTool,
    PromptOptimizeTool,
    QuestionAnsweringTool,
    RegexGenerateTool,
    SentimentAnalysisTool,
    SQLQueryGenerateTool,
    TestGenerationTool,
    TextClassificationTool,
    TextSummarizationTool,
)
# FAZ 2: Cloud Tools
from app.services.tools.cloud_tools import (
    AWSEC2ListTool,
    AWSS3ListTool,
    AWSS3UploadTool,
    AzureBlobListTool,
    GCPStorageListTool,
)
# FAZ 3: Data Science Tools
from app.services.tools.data_science_tools import (
    CorrelationAnalysisTool,
    KMeansClusteringTool,
    LinearRegressionTool,
    MatplotlibBarChartTool,
    MatplotlibLineChartTool,
    MatplotlibScatterPlotTool,
    PandasDescribeTool,
    PandasReadCSVTool,
    TimeSeriesForecastTool,
)
from app.services.tools.utility_tools import (
    GetIPAddressTool,
    Base64Tool,
    HashGeneratorTool,
    UUIDGeneratorTool,
    TextStatsTool,
    WeatherTool,
)
# FAZ 4: Blockchain & Crypto Tools (Devre disi)
# from app.services.tools.blockchain_tools import (
#     BitcoinBalanceTool,
#     BitcoinBlockHeightTool,
#     BitcoinTransactionTool,
#     BlockchainExplorerLinkTool,
#     CryptoHistoricalDataTool,
#     CryptoMarketCapTool,
#     CryptoPriceTool,
#     DeFiPoolInfoTool,
#     DeFiSwapQuoteTool,
#     ENSResolveTool,
#     EthereumBalanceTool,
#     EthereumBlockInfoTool,
#     EthereumGasPriceTool,
#     EthereumSmartContractCallTool,
#     EthereumTransactionTool,
#     IPFSDownloadTool,
#     IPFSUploadTool,
#     NFTOwnershipTool,
#     NFTMetadataTool,
#     TokenBalanceTool,
#     TokenTransferTool,
#     WalletCreateTool,
#     WalletImportTool,
#     Web3SignMessageTool,
#     Web3VerifySignatureTool,
# )
# FAZ 16: Testing & QA Tools
from app.services.tools.testing_tools import (
    UnitTestGenerateTool,
    UnitTestRunTool,
    IntegrationTestTool,
    APITestGenerateTool,
    APITestRunTool,
    UITestRecordTool,
    UITestPlaybackTool,
    PerformanceTestTool,
    LoadTestTool,
    StressTestTool,
    SecurityTestScanTool,
    AccessibilityTestTool,
    CrossBrowserTestTool,
    MobileTestTool,
    TestCoverageReportTool,
    TestCaseManagementTool,
    BugReportGenerateTool,
    RegressionTestTool,
    SmokeTestTool,
    AcceptanceTestTool,
)
# FAZ 17: Monitoring & Observability Tools
from app.services.tools.monitoring_tools import (
    SystemMetricsCollectTool,
    CPUUsageMonitorTool,
    MemoryUsageMonitorTool,
    DiskUsageMonitorTool,
    NetworkTrafficMonitorTool,
    ProcessMonitorTool,
    LogAggregationTool,
    LogAnalysisTool,
    ErrorTrackingTool,
    PerformanceMonitoringTool,
    UptimeMonitoringTool,
    AlertConfigurationTool,
    DashboardCreateTool,
    MetricsVisualizationTool,
    AnomalyDetectionTool,
    TracingSetupTool,
    DistributedTracingTool,
    ServiceMeshMonitorTool,
    ContainerMonitoringTool,
    KubernetesMonitoringTool,
    DatabaseMonitoringTool,
    APIMonitoringTool,
    UserExperienceMonitorTool,
    SyntheticMonitoringTool,
    IncidentResponseTool,
)
# FAZ 5: Social Media Tools (Devre disi)
# from app.services.tools.social_media_tools import (
#     TwitterPostTweetTool,
#     TwitterReplyTool,
#     TwitterRetweetTool,
#     TwitterLikeTool,
#     TwitterSearchTool,
#     TwitterUserInfoTool,
#     TwitterFollowersTool,
#     TwitterTimelineTool,
#     TwitterTrendsTool,
#     TwitterDMSendTool,
#     InstagramPostPhotoTool,
#     InstagramPostStoryTool,
#     InstagramLikeTool,
#     InstagramCommentTool,
#     InstagramFollowTool,
#     InstagramUserInfoTool,
#     InstagramHashtagSearchTool,
#     InstagramDMSendTool,
#     LinkedinPostTool,
#     LinkedinCommentTool,
#     LinkedinLikeTool,
#     LinkedinConnectTool,
#     LinkedinMessageTool,
#     LinkedinJobSearchTool,
#     LinkedinProfileInfoTool,
#     RedditPostTool,
#     RedditCommentTool,
#     RedditUpvoteTool,
#     RedditSearchTool,
#     RedditSubredditInfoTool,
# )
# FAZ 6: Multimedia Advanced Tools
from app.services.tools.multimedia_advanced_tools import (
    VideoTrimTool,
    VideoMergeTool,
    VideoResizeTool,
    VideoCompressTool,
    VideoExtractAudioTool,
    VideoAddSubtitleTool,
    VideoWatermarkTool,
    VideoSpeedChangeTool,
    VideoReverseTool,
    VideoRotateTool,
    VideoThumbnailTool,
    VideoMetadataTool,
    VideoConvertFormatTool,
    VideoStabilizeTool,
    VideoColorGradeTool,
    AudioTrimTool,
    AudioMergeTool,
    AudioNormalizeTool,
    AudioCompressTool,
    AudioFadeTool,
    AudioPitchShiftTool,
    AudioTempoChangeTool,
    AudioNoiseReduceTool,
    AudioEqualizerTool,
    AudioReverbTool,
    AudioConvertFormatTool,
    AudioExtractVocalsTool,
    ImageResizeTool,
    ImageCropTool,
    ImageRotateTool,
    ImageFilterTool,
    ImageEnhanceTool,
    ImageRemoveBackgroundTool,
    ImageFaceDetectTool,
    ImageOCRTool,
)
# FAZ 7: IoT & Hardware Tools (Devre disi)
# from app.services.tools.iot_tools import (
#     SerialPortListTool,
#     SerialPortReadTool,
#     SerialPortWriteTool,
#     ArduinoUploadTool,
#     ArduinoSerialMonitorTool,
#     RaspberryPiGPIOReadTool,
#     RaspberryPiGPIOWriteTool,
#     MQTTPublishTool,
#     MQTTSubscribeTool,
#     MQTTBrokerConnectTool,
#     BluetoothScanTool,
#     BluetoothConnectTool,
#     BluetoothSendTool,
#     USBDeviceListTool,
#     USBDeviceInfoTool,
#     SensorReadTemperatureTool,
#     SensorReadHumidityTool,
#     CameraCapturedTool,
#     CameraStreamTool,
#     SmartHomeControlTool,
# )
# FAZ 8: Finance & Trading Tools
from app.services.tools.finance_tools import (
    StockPriceTool,
    StockHistoricalTool,
    StockCompanyInfoTool,
    StockFinancialsTool,
    StockNewsTool,
    StockScreenerTool,
    ForexRateTool,
    ForexConvertTool,
    ForexHistoricalTool,
    CommodityPriceTool,
    BondYieldTool,
    EconomicCalendarTool,
    MarketIndexTool,
    PortfolioValueTool,
    PortfolioPerformanceTool,
    RiskAnalysisTool,
    DividendCalendarTool,
    EarningsCalendarTool,
    TechnicalIndicatorRSITool,
    TechnicalIndicatorMACDTool,
    TechnicalIndicatorBollingerTool,
    BacktestingStrategyTool,
    TradingSignalTool,
    MarketSentimentTool,
    FinancialCalculatorTool,
)
# FAZ 9: Health & Fitness Tools
from app.services.tools.health_tools import (
    BMICalculateTool,
    CalorieCalculateTool,
    MacroCalculateTool,
    WaterIntakeTrackTool,
    SleepTrackerTool,
    HeartRateZoneTool,
    WorkoutPlanTool,
    ExerciseDatabaseTool,
    NutritionInfoTool,
    MealPlanTool,
    SupplementInfoTool,
    MedicalReminderTool,
    SymptomCheckerTool,
    FirstAidGuideTool,
    MeditationTimerTool,
    BreathingExerciseTool,
    PostureReminderTool,
    EyeRestReminderTool,
    HealthGoalTrackerTool,
    FitnessProgressTool,
)
# FAZ 10: Education & Learning Tools
from app.services.tools.education_tools import (
    QuizGeneratorTool,
    FlashcardGeneratorTool,
    StudyPlanGeneratorTool,
    PomodoroTimerTool,
    NoteTakerTool,
    MindMapGeneratorTool,
    SummaryGeneratorTool,
    VocabularyBuilderTool,
    LanguageTutorTool,
    MathHelperTool,
    ScienceExplainerTool,
    HistoryTimelineTool,
    EssayAssistantTool,
    ResearchPaperSearchTool,
    CitationGeneratorTool,
    PlagiarismCheckerTool,
    CodeTutorTool,
    ProjectIdeaTool,
    AssignmentTrackerTool,
    GradeCalculatorTool,
    EducationResourcesTool,
    ScholarshipFinderTool,
    CareerPathTool,
    SkillAssessmentTool,
    LearningPathTool,
)
# FAZ 18: Backup & Recovery Tools
from app.services.tools.backup_tools import (
    FileBackupCreateTool,
    FileBackupRestoreTool,
    DatabaseBackupTool,
    DatabaseRestoreTool,
    SystemBackupTool,
    SystemRestoreTool,
    CloudBackupTool,
    IncrementalBackupTool,
    DifferentialBackupTool,
    BackupScheduleTool,
    BackupVerificationTool,
    DisasterRecoveryPlanTool,
    BackupEncryptionTool,
    BackupCompressionTool,
    BackupRetentionPolicyTool,
)

logger = logging.getLogger(__name__)


class ToolRegistry:
    """Singleton-benzeri kayit defteri."""

    def __init__(self) -> None:
        self._tools: Dict[str, BaseTool] = {}
        self._register_defaults()

    def _register_defaults(self) -> None:
        defaults: List[BaseTool] = [
            # Browser & web
            OpenUrlTool(),
            WebSearchTool(),
            HttpRequestTool(),
            DownloadFileTool(),
            PingHostTool(),
            # System (genel)
            RunCommandTool(),
            OpenAppTool(),
            SystemInfoTool(),
            GetDateTimeTool(),
            LockScreenTool(),
            SetVolumeTool(),
            ShutdownTool(),
            CancelShutdownTool(),
            # Process
            ListProcessesTool(),
            KillProcessTool(),
            # Window
            ListWindowsTool(),
            FocusWindowTool(),
            MinimizeWindowTool(),
            MaximizeWindowTool(),
            CloseWindowTool(),
            # File - temel
            ReadFileTool(),
            WriteFileTool(),
            AppendFileTool(),
            ListDirTool(),
            # File - extra
            SearchFilesTool(),
            CopyFileTool(),
            MoveFileTool(),
            DeleteFileTool(),
            MkdirTool(),
            ZipTool(),
            UnzipTool(),
            # UI otomasyon
            ScreenshotTool(),
            ClickTool(),
            TypeTextTool(),
            KeyPressTool(),
            MouseMoveTool(),
            # Clipboard
            ClipboardGetTool(),
            ClipboardSetTool(),
            # Media
            TextToSpeechTool(),
            ShowNotificationTool(),
            PlayBeepTool(),
            # Code
            PythonEvalTool(),
            EvaluateMathTool(),
            RegexMatchTool(),
            # Memory (eski basit dict-tabanli)
            SaveMemoryTool(),
            RecallMemoryTool(),
            ListMemoryTool(),
            DeleteMemoryTool(),
            # v2: browser otomasyon (FAZ 2.2 + 2.3)
            BrowserNavigateTool(),
            BrowserGetTextTool(),
            BrowserClickTool(),
            BrowserFillTool(),
            BrowserScreenshotTool(),
            ReadWebpageTool(),
            ReadWebpageMarkdownTool(),
            InstallProjectDependencyTool(),
            # v2: dokuman okuma (FAZ 2.4)
            ReadDocumentTool(),
            GitHubAPITool(),
            DockerSandboxRunTool(),
            ParseLayoutDocumentTool(),
            # v2: vector + ingest (FAZ 3.3, 3.4)
            VectorSearchTool(),
            VectorUpsertTool(),
            IngestDocumentTool(),
            # v2: knowledge graph (FAZ 3.5)
            KGAddEntityTool(),
            KGAddRelationTool(),
            KGQueryNeighborsTool(),
            KGSearchTool(),
            # v2: agent-to-agent delegasyon (FAZ 4.1)
            DelegateToAgentTool(),
            # v3 Sprint 3.1: Git
            GitCloneTool(),
            GitStatusTool(),
            GitPullTool(),
            GitPushTool(),
            GitCommitTool(),
            GitDiffTool(),
            GitBranchListTool(),
            GitBranchSwitchTool(),
            GitLogTool(),
            GitInitTool(),
            # v3 Sprint 3.2: Email
            EmailSendTool(),
            EmailReadInboxTool(),
            # v3 Sprint 3.3: Database
            DBQueryTool(),
            DBExecuteTool(),
            DBSchemaTool(),
            # v3 Sprint 3.4: Image generate
            ImageGenerateTool(),
            # v3 Sprint 3.5: PDF + XLSX
            PDFGenerateTool(),
            XLSXWriteTool(),
            # v3 Sprint 3.6: Messaging
            SlackSendTool(),
            DiscordSendTool(),
            TelegramSendTool(),
            # Sprint D.2: Akademik & Arastirma
            ArxivSearchTool(),
            WikipediaLookupTool(),
            YoutubeSearchTool(),
            YoutubeTranscriptTool(),
            # Sprint D.4: Dokuman extra
            PDFMergeTool(),
            PDFSplitTool(),
            PPTXGenerateTool(),
            MarkdownToHtmlTool(),
            # Sprint D.7: Guvenlik & Ag
            DNSLookupTool(),
            WhoisQueryTool(),
            SSLCertCheckTool(),
            PortScanTool(),
            # Sprint D.6: DevOps
            DockerPsTool(),
            DockerLogsTool(),
            DockerRunTool(),
            DockerBuildTool(),
            KubectlGetTool(),
            KubectlLogsTool(),
            KubectlApplyTool(),
            # FAZ 1: AI & ML Tools
            HuggingfaceInferenceTool(),
            OpenAIEmbeddingTool(),
            OpenAIModerationTool(),
            SentimentAnalysisTool(),
            TextSummarizationTool(),
            TextClassificationTool(),
            CodeGenerationTool(),
            QuestionAnsweringTool(),
            ParaphraseTextTool(),
            CodeExplanationTool(),
            BugDetectionTool(),
            TestGenerationTool(),
            DocumentationGenerateTool(),
            SQLQueryGenerateTool(),
            RegexGenerateTool(),
            DataValidationRulesTool(),
            PromptOptimizeTool(),
            # FAZ 2: Cloud Tools
            AWSS3ListTool(),
            AWSS3UploadTool(),
            AWSEC2ListTool(),
            AzureBlobListTool(),
            GCPStorageListTool(),
            # FAZ 3: Data Science Tools
            PandasReadCSVTool(),
            PandasDescribeTool(),
            MatplotlibLineChartTool(),
            MatplotlibBarChartTool(),
            MatplotlibScatterPlotTool(),
            LinearRegressionTool(),
            KMeansClusteringTool(),
            CorrelationAnalysisTool(),
            TimeSeriesForecastTool(),
            # FAZ 4: Blockchain & Crypto Tools (Devre disi)
            # EthereumBalanceTool(),
            # EthereumTransactionTool(),
            # EthereumGasPriceTool(),
            # EthereumBlockInfoTool(),
            # EthereumSmartContractCallTool(),
            # BitcoinBalanceTool(),
            # BitcoinTransactionTool(),
            # BitcoinBlockHeightTool(),
            # CryptoPriceTool(),
            # CryptoMarketCapTool(),
            # CryptoHistoricalDataTool(),
            # NFTMetadataTool(),
            # NFTOwnershipTool(),
            # WalletCreateTool(),
            # WalletImportTool(),
            # TokenBalanceTool(),
            # TokenTransferTool(),
            # DeFiPoolInfoTool(),
            # DeFiSwapQuoteTool(),
            # IPFSUploadTool(),
            # IPFSDownloadTool(),
            # ENSResolveTool(),
            # Web3SignMessageTool(),
            # Web3VerifySignatureTool(),
            # BlockchainExplorerLinkTool(),
            # FAZ 5: Social Media Tools (Devre disi)
            # TwitterPostTweetTool(),
            # TwitterReplyTool(),
            # TwitterRetweetTool(),
            # TwitterLikeTool(),
            # TwitterSearchTool(),
            # TwitterUserInfoTool(),
            # TwitterFollowersTool(),
            # TwitterTimelineTool(),
            # TwitterTrendsTool(),
            # TwitterDMSendTool(),
            # InstagramPostPhotoTool(),
            # InstagramPostStoryTool(),
            # InstagramLikeTool(),
            # InstagramCommentTool(),
            # InstagramFollowTool(),
            # InstagramUserInfoTool(),
            # InstagramHashtagSearchTool(),
            # InstagramDMSendTool(),
            # LinkedinPostTool(),
            # LinkedinCommentTool(),
            # LinkedinLikeTool(),
            # LinkedinConnectTool(),
            # LinkedinMessageTool(),
            # LinkedinJobSearchTool(),
            # LinkedinProfileInfoTool(),
            # RedditPostTool(),
            # RedditCommentTool(),
            # RedditUpvoteTool(),
            # RedditSearchTool(),
            # RedditSubredditInfoTool(),
            # FAZ 6: Multimedia Advanced Tools
            VideoTrimTool(),
            VideoMergeTool(),
            VideoResizeTool(),
            VideoCompressTool(),
            VideoExtractAudioTool(),
            VideoAddSubtitleTool(),
            VideoWatermarkTool(),
            VideoSpeedChangeTool(),
            VideoReverseTool(),
            VideoRotateTool(),
            VideoThumbnailTool(),
            VideoMetadataTool(),
            VideoConvertFormatTool(),
            VideoStabilizeTool(),
            VideoColorGradeTool(),
            AudioTrimTool(),
            AudioMergeTool(),
            AudioNormalizeTool(),
            AudioCompressTool(),
            AudioFadeTool(),
            AudioPitchShiftTool(),
            AudioTempoChangeTool(),
            AudioNoiseReduceTool(),
            AudioEqualizerTool(),
            AudioReverbTool(),
            AudioConvertFormatTool(),
            AudioExtractVocalsTool(),
            ImageResizeTool(),
            ImageCropTool(),
            ImageRotateTool(),
            ImageFilterTool(),
            ImageEnhanceTool(),
            ImageRemoveBackgroundTool(),
            ImageFaceDetectTool(),
            ImageOCRTool(),
            # FAZ 7: IoT & Hardware Tools (Devre disi)
            # SerialPortListTool(),
            # SerialPortReadTool(),
            # SerialPortWriteTool(),
            # ArduinoUploadTool(),
            # ArduinoSerialMonitorTool(),
            # RaspberryPiGPIOReadTool(),
            # RaspberryPiGPIOWriteTool(),
            # MQTTPublishTool(),
            # MQTTSubscribeTool(),
            # MQTTBrokerConnectTool(),
            # BluetoothScanTool(),
            # BluetoothConnectTool(),
            # BluetoothSendTool(),
            # USBDeviceListTool(),
            # USBDeviceInfoTool(),
            # SensorReadTemperatureTool(),
            # SensorReadHumidityTool(),
            # CameraCapturedTool(),
            # CameraStreamTool(),
            # SmartHomeControlTool(),
            # FAZ 8: Finance & Trading Tools
            StockPriceTool(),
            StockHistoricalTool(),
            StockCompanyInfoTool(),
            StockFinancialsTool(),
            StockNewsTool(),
            StockScreenerTool(),
            ForexRateTool(),
            ForexConvertTool(),
            ForexHistoricalTool(),
            CommodityPriceTool(),
            BondYieldTool(),
            EconomicCalendarTool(),
            MarketIndexTool(),
            PortfolioValueTool(),
            PortfolioPerformanceTool(),
            RiskAnalysisTool(),
            DividendCalendarTool(),
            EarningsCalendarTool(),
            TechnicalIndicatorRSITool(),
            TechnicalIndicatorMACDTool(),
            TechnicalIndicatorBollingerTool(),
            BacktestingStrategyTool(),
            TradingSignalTool(),
            MarketSentimentTool(),
            FinancialCalculatorTool(),
            # FAZ 9: Health & Fitness Tools
            BMICalculateTool(),
            CalorieCalculateTool(),
            MacroCalculateTool(),
            WaterIntakeTrackTool(),
            SleepTrackerTool(),
            HeartRateZoneTool(),
            WorkoutPlanTool(),
            ExerciseDatabaseTool(),
            NutritionInfoTool(),
            MealPlanTool(),
            SupplementInfoTool(),
            MedicalReminderTool(),
            SymptomCheckerTool(),
            FirstAidGuideTool(),
            MeditationTimerTool(),
            BreathingExerciseTool(),
            PostureReminderTool(),
            EyeRestReminderTool(),
            HealthGoalTrackerTool(),
            FitnessProgressTool(),
            # FAZ 10: Education & Learning Tools
            QuizGeneratorTool(),
            FlashcardGeneratorTool(),
            StudyPlanGeneratorTool(),
            PomodoroTimerTool(),
            NoteTakerTool(),
            MindMapGeneratorTool(),
            SummaryGeneratorTool(),
            VocabularyBuilderTool(),
            LanguageTutorTool(),
            MathHelperTool(),
            ScienceExplainerTool(),
            HistoryTimelineTool(),
            EssayAssistantTool(),
            ResearchPaperSearchTool(),
            CitationGeneratorTool(),
            PlagiarismCheckerTool(),
            CodeTutorTool(),
            ProjectIdeaTool(),
            AssignmentTrackerTool(),
            GradeCalculatorTool(),
            EducationResourcesTool(),
            ScholarshipFinderTool(),
            CareerPathTool(),
            SkillAssessmentTool(),
            LearningPathTool(),
            UnitTestGenerateTool(),
            UnitTestRunTool(),
            IntegrationTestTool(),
            APITestGenerateTool(),
            APITestRunTool(),
            UITestRecordTool(),
            UITestPlaybackTool(),
            PerformanceTestTool(),
            LoadTestTool(),
            StressTestTool(),
            SecurityTestScanTool(),
            AccessibilityTestTool(),
            CrossBrowserTestTool(),
            MobileTestTool(),
            TestCoverageReportTool(),
            TestCaseManagementTool(),
            BugReportGenerateTool(),
            RegressionTestTool(),
            SmokeTestTool(),
            AcceptanceTestTool(),
            # FAZ 17: Monitoring & Observability Tools
            SystemMetricsCollectTool(),
            CPUUsageMonitorTool(),
            MemoryUsageMonitorTool(),
            DiskUsageMonitorTool(),
            NetworkTrafficMonitorTool(),
            ProcessMonitorTool(),
            LogAggregationTool(),
            LogAnalysisTool(),
            ErrorTrackingTool(),
            PerformanceMonitoringTool(),
            UptimeMonitoringTool(),
            AlertConfigurationTool(),
            DashboardCreateTool(),
            MetricsVisualizationTool(),
            AnomalyDetectionTool(),
            TracingSetupTool(),
            DistributedTracingTool(),
            ServiceMeshMonitorTool(),
            ContainerMonitoringTool(),
            KubernetesMonitoringTool(),
            DatabaseMonitoringTool(),
            APIMonitoringTool(),
            UserExperienceMonitorTool(),
            SyntheticMonitoringTool(),
            IncidentResponseTool(),
            # FAZ 18: Backup & Recovery Tools
            FileBackupCreateTool(),
            FileBackupRestoreTool(),
            DatabaseBackupTool(),
            DatabaseRestoreTool(),
            SystemBackupTool(),
            SystemRestoreTool(),
            CloudBackupTool(),
            IncrementalBackupTool(),
            DifferentialBackupTool(),
            BackupScheduleTool(),
            BackupVerificationTool(),
            DisasterRecoveryPlanTool(),
            BackupEncryptionTool(),
            BackupCompressionTool(),
            BackupRetentionPolicyTool(),
            # Utility Tools
            GetIPAddressTool(),
            Base64Tool(),
            HashGeneratorTool(),
            UUIDGeneratorTool(),
            TextStatsTool(),
            WeatherTool(),
            # Explicit HITL Approval
            AgentWaitForApprovalTool(),
            # Blackboard State Shared Memory
            BlackboardSetTool(),
            BlackboardGetTool(),
            # 20 New Critical Integration Tools
            InteractiveBrowserClickTool(),
            InteractiveBrowserTypeTool(),
            InteractiveBrowserScrollTool(),
            WebPDFGeneratorTool(),
            SandboxExecutePythonTool(),
            SandboxExecuteJSTool(),
            SandboxInstallPackageTool(),
            GenericAPIRequestTool(),
            GoogleCalendarManageTool(),
            GoogleSheetsSyncTool(),
            NotionPagesManageTool(),
            JiraTicketCreateTool(),
            GitHubPullRequestManageTool(),
            SpeechToTextFileTool(),
            ImageOCRReadTool(),
            VectorDatabaseSearchTool(),
            DocumentSummarizerHeavyTool(),
            AgentAskUserQuestionTool(),
            AgentSleepTool(),
        ]
        for t in defaults:
            self.register(t)

    def register(self, tool: BaseTool) -> None:
        if tool.name in self._tools:
            logger.warning("Tool zaten kayitli, uzerine yaziliyor: %s", tool.name)
        self._tools[tool.name] = tool

    def get(self, name: str) -> Optional[BaseTool]:
        return self._tools.get(name)

    def all(self) -> List[BaseTool]:
        return list(self._tools.values())

    # ---------- Izin filtresi ----------

    @staticmethod
    def _is_permitted(perm: PermissionKey, perms: AgentPermissions) -> bool:
        if perm == "none":
            return True
        return bool(getattr(perms, perm, False))

    def filter_for_agent(self, perms: AgentPermissions) -> List[BaseTool]:
        return [t for t in self._tools.values() if self._is_permitted(t.permission, perms)]

    def openai_schemas(self, perms: AgentPermissions, provider_name: str = "openai") -> List[Dict[str, Any]]:
        # Groq'un ucretsiz katmanindaki cok dar TPM (12000 tokens/dakika) limiti nedeniyle tool sayisini 30 ile kısıtlayalım.
        # Bu, her istekte devasa sema yukunu engeller.
        schemas = [t.to_openai_schema() for t in self.filter_for_agent(perms)]
        limit = 30 if provider_name.lower() == "groq" else 128
        return schemas[:limit]

    def anthropic_schemas(self, perms: AgentPermissions) -> List[Dict[str, Any]]:
        schemas = [t.to_anthropic_schema() for t in self.filter_for_agent(perms)]
        return schemas[:128]

    # ---------- Calistirma ----------

    async def execute(
        self,
        name: str,
        args: Dict[str, Any],
        perms: AgentPermissions,
        context: ToolContext,
        timeout: float = 60.0,
    ) -> ToolResult:
        tool = self._tools.get(name)
        if not tool:
            return ToolResult(ok=False, error=f"Bilinmeyen tool: {name}")
        if not self._is_permitted(tool.permission, perms):
            return ToolResult(
                ok=False,
                error=f"'{name}' icin izin yok ({tool.permission}). Kullanici ayarlardan izin vermeli.",
            )

        # ============ HITL Approval kontrolu (FAZ 1.5) ============
        try:
            from app.services.approval_service import (
                approval_service,
                requires_approval,
            )
            if requires_approval(name, args):
                approved, reason = await approval_service.request_approval(
                    agent_id=context.agent_id,
                    tool_name=name,
                    arguments=args,
                    conversation_id=getattr(context, "conversation_id", None) or context.extra.get("conversation_id"),
                    plan_id=context.extra.get("plan_id"),
                    step_id=context.extra.get("step_id"),
                )
                if not approved:
                    return ToolResult(
                        ok=False,
                        error=f"Kullanici onayi alinamadi: {reason}",
                    )
        except Exception as exc:  # pragma: no cover
            logger.warning("Approval kontrolu hatasi (gecildi): %s", exc)
        # ============ /HITL ============

        # ============ Sandbox kontrolu (FAZ 7.1) ============
        try:
            from app.services.security.sandbox import check_sandbox
            sandbox_ok, sandbox_err = check_sandbox(name, args)
            if not sandbox_ok:
                return ToolResult(ok=False, error=f"Sandbox: {sandbox_err}")
        except ImportError:
            pass  # sandbox modulu yoksa atla
        except Exception as exc:  # pragma: no cover
            logger.warning("Sandbox kontrolu hatasi (gecildi): %s", exc)
        # ============ /Sandbox ============

        try:
            result = await asyncio.wait_for(tool.execute(args, context), timeout=timeout)
        except asyncio.TimeoutError:
            result = ToolResult(ok=False, error=f"Tool zaman asimi: {name} ({timeout}s)")
        except Exception as exc:
            logger.exception("Tool calistirma hatasi: %s", name)
            result = ToolResult(ok=False, error=f"Tool hatasi: {exc}")

        # ============ Audit log (FAZ 1.6) ============
        try:
            from app.services.audit import audit_chain
            await audit_chain.append(
                event_type="tool_executed",
                payload={
                    "tool": name,
                    "arguments": args,
                    "ok": result.ok,
                    "error": result.error,
                    "output_preview": (result.output or "")[:200]},
                agent_id=context.agent_id,
            )
        except Exception as exc:  # pragma: no cover
            logger.warning("Audit yazma hatasi: %s", exc)
        # ============ /Audit ============

        return result


# Singleton
tool_registry = ToolRegistry()