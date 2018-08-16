import classNames from 'classnames'
import React from 'react'
import { connect } from 'react-redux'
import { ipcRenderer } from 'electron'
import { Button, NonIdealState, Spinner } from '@blueprintjs/core'

import { PhotoId, PhotoType, PhotoWork, PhotoSectionId, PhotoSectionById } from '../../../common/models/Photo'
import CancelablePromise from '../../../common/util/CancelablePromise'
import { bindMany } from '../../../common/util/LangUtil'

import { setDetailPhotoById } from '../../controller/DetailController'
import { getThumbnailSrc, createThumbnail } from '../../controller/ImageProvider'
import { fetchTotalPhotoCount, fetchSections, setLibraryFilter, updatePhotoWork, setPhotosFlagged } from '../../controller/PhotoController'
import { setSelectedPhotosAction, openExportAction } from '../../state/actions'
import { AppState } from '../../state/reducers'
import { keySymbols } from '../../UiConstants'
import { FetchState } from '../../UITypes'
import store from '../../state/store'
import LibraryTopBar from './LibraryTopBar'
import LibraryBottomBar from './LibraryBottomBar'
import Grid from './Grid'

import './Library.less'


interface OwnProps {
    style?: any
    className?: any
    isActive: boolean
}

interface StateProps {
    isFetching: boolean
    photoCount: number
    totalPhotoCount: number
    sectionIds: PhotoSectionId[]
    sectionById: PhotoSectionById
    selectedSectionId: PhotoSectionId
    selectedPhotoIds: PhotoId[]
    showOnlyFlagged: boolean
    isShowingTrash: boolean
}

interface DispatchProps {
    fetchTotalPhotoCount: () => void
    fetchSections: () => void
    getThumbnailSrc: (photo: PhotoType) => string
    createThumbnail: (photo: PhotoType) => CancelablePromise<string>
    setSelectedPhotos: (sectionId: PhotoSectionId, photoIds: PhotoId[]) => void
    setDetailPhotoById: (sectionId: PhotoSectionId, photoId: PhotoId) => void
    openExport: (sectionId: PhotoSectionId, photoIds: PhotoId[]) => void
    setPhotosFlagged: (photos: PhotoType[], flag: boolean) => void
    updatePhotoWork: (photo: PhotoType, update: (photoWork: PhotoWork) => void) => void
    toggleShowOnlyFlagged: () => void
    startScanning: () => void
}

interface Props extends OwnProps, StateProps, DispatchProps {
}

export class Library extends React.Component<Props> {

    constructor(props: Props) {
        super(props);

        bindMany(this, 'openExport', 'clearHighlight')
    }

    componentDidUpdate(prevProps: Props, prevState) {
        const props = this.props

        const isExportEnabled = props.isActive && props.selectedPhotoIds.length > 0
        const prevIsExportEnabled = prevProps.isActive && prevProps.selectedPhotoIds.length > 0
        if (isExportEnabled !== prevIsExportEnabled) {
            ipcRenderer.send('toggleExportMenu', isExportEnabled)
            if (isExportEnabled) {
                ipcRenderer.on('exportClicked', this.openExport)
            } else {
                ipcRenderer.removeAllListeners('exportClicked')
            }
        }
    }

    componentDidMount() {
        this.props.fetchTotalPhotoCount()
        this.props.fetchSections()
    }

    openExport() {
        const props = this.props
        props.openExport(props.selectedSectionId, props.selectedPhotoIds)
    }

    clearHighlight() {
        const props = this.props
        props.setSelectedPhotos(props.selectedSectionId, [])
    }

    render() {
        const props = this.props

        let currentView;

        if (props.isFetching) {
            currentView = <Spinner className="Library-spinner" size={Spinner.SIZE_LARGE} />
        } else if (props.totalPhotoCount === 0) {
            const description =
                <>
                    Press <code>{keySymbols.ctrlOrMacCommand}</code>+<code>R</code> or button below to start scanning.
                </>
            const action =
                <div className="bp3-dark">
                    <Button onClick={props.startScanning}>Start scanning</Button>
                </div>
            currentView =
                <NonIdealState
                    icon="zoom-out"
                    title="No photos imported"
                    description={description}
                    action={action}
                />
        } else if (props.photoCount === 0) {
            currentView =
                <NonIdealState
                    icon="zoom-out"
                    title="No photos found"
                    description="Your current selection doesn't match any photo. Please change your selection on the left."
                />
        } else {
            currentView =
                <Grid
                    isActive={props.isActive}
                    sectionIds={props.sectionIds}
                    sectionById={props.sectionById}
                    selectedSectionId={props.selectedSectionId}
                    selectedPhotoIds={props.selectedPhotoIds}
                    getThumbnailSrc={props.getThumbnailSrc}
                    createThumbnail={props.createThumbnail}
                    setSelectedPhotos={props.setSelectedPhotos}
                    setDetailPhotoById={props.setDetailPhotoById}
                />
        }

        return (
            <div ref="library" className={classNames(props.className, 'Library')} style={props.style}>
                <LibraryTopBar
                    className="Library-topBar"
                    photosCount={props.photoCount}
                    selectedSection={props.sectionById[props.selectedSectionId]}
                    selectedPhotoIds={props.selectedPhotoIds}
                    showOnlyFlagged={props.showOnlyFlagged}
                    isShowingTrash={props.isShowingTrash}
                    openExport={this.openExport}
                    updatePhotoWork={props.updatePhotoWork}
                    setPhotosFlagged={props.setPhotosFlagged}
                    toggleShowOnlyFlagged={props.toggleShowOnlyFlagged}
                />
                <div className="Library-body">
                    {currentView}
                </div>
                <LibraryBottomBar
                    className="Library-bottomBar"
                    highlightedCount={props.selectedPhotoIds.length}
                    photosCount={props.photoCount}
                    clearHighlight={this.clearHighlight}
                />
            </div>
        );
    }
}


const Connected = connect<StateProps, DispatchProps, OwnProps, AppState>(
    (state: AppState, props) => {
        const sections = state.data.sections
        return {
            ...props,
            isFetching: sections.fetchState === FetchState.FETCHING,
            photoCount: sections.photoCount,
            totalPhotoCount: sections.totalPhotoCount,
            sectionIds: sections.ids,
            sectionById: sections.data,
            selectedSectionId: state.library.selection.sectionId, 
            selectedPhotoIds: state.library.selection.photoIds,
            showOnlyFlagged: state.library.filter.showOnlyFlagged,
            isShowingTrash: state.library.filter.mainFilter && state.library.filter.mainFilter.type === 'trash'
        }
    },
    dispatch => ({
        fetchTotalPhotoCount,
        fetchSections,
        getThumbnailSrc,
        createThumbnail,
        setSelectedPhotos: (sectionId, photoIds) => dispatch(setSelectedPhotosAction(sectionId, photoIds)),
        setDetailPhotoById,
        openExport: (sectionId, photoIds) => dispatch(openExportAction(sectionId, photoIds)),
        setPhotosFlagged,
        updatePhotoWork,
        toggleShowOnlyFlagged: () => {
            const oldFilter = store.getState().library.filter
            setLibraryFilter({ ...oldFilter, showOnlyFlagged: !oldFilter.showOnlyFlagged })
        },
        startScanning: () => {
            ipcRenderer.send('start-scanning')
        }
    })
)(Library)

export default Connected