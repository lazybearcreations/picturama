import React from 'react'

import CancelablePromise from 'common/util/CancelablePromise'
import { Photo, PhotoSectionId } from 'common/CommonTypes'
import { getNonRawUrl } from 'common/util/DataUtil'

import { defaultGridRowHeight } from 'app/UiConstants'
import GridSection from 'app/ui/library/GridSection'
import { estimateContainerHeight, createDummyLayoutBoxes } from 'app/controller/LibraryController'

import { addSection, action } from 'test-ui/core/UiTester'
import { createTestPhotoId, testBigPhoto, testPanoramaPhoto, testPortraitPhoto } from 'test-ui/util/MockData'
import { createSection, createRandomDummyPhoto, createLayoutForSection } from 'test-ui/util/TestUtil'


const containerWidth = 800
const scrollBarWidth = 20
const viewportWidth = containerWidth - scrollBarWidth

const defaultSectionId: PhotoSectionId = '2018-08-15'
const defaultPhotos = [ testBigPhoto, testPortraitPhoto, testPanoramaPhoto ]
const defaultSection = createSection(defaultSectionId, defaultPhotos)
const defaultLayout = createLayoutForSection(defaultSection, 0, viewportWidth, defaultGridRowHeight)


const defaultProps = {
    section: defaultSection,
    layout: defaultLayout,
    selectedPhotoIds: null,
    getThumbnailSrc: (photo: Photo) => getNonRawUrl(photo),
    createThumbnail: (sectionId: PhotoSectionId, photo: Photo) => {
        if (photo.master_filename === 'dummy') {
            return new CancelablePromise<string>(() => {})
        } else {
            return new CancelablePromise<string>(Promise.resolve(getNonRawUrl(photo)))
        }
    },
    onPhotoClick: action('onPhotoClick'),
    onPhotoDoubleClick: action('onPhotoDoubleClick'),
}


addSection('GridSection')
    .setArenaStyle({ width: containerWidth, padding: 0, backgroundColor: '#cfd8dc', overflowY: 'auto' })
    .add('normal', context => (
        <GridSection
            {...defaultProps}
        />
    ))
    .add('selection', context => (
        <GridSection
            {...defaultProps}
            selectedPhotoIds={[ testPortraitPhoto.id ]}
        />
    ))
    .add('creating thumbnails', context => {
        let photos = [ ...defaultPhotos ]
        for (let i = 0; i < 20; i++) {
            photos.push(createRandomDummyPhoto())
        }
        photos[0] = { ...photos[0], id: createTestPhotoId(), master_filename: 'dummy' }
        const section = createSection(defaultSectionId, photos)
        const layout = createLayoutForSection(section, 0, viewportWidth, defaultGridRowHeight)

        return (
            <GridSection
                {...defaultProps}
                section={section}
                layout={layout}
            />
        )
    })
    .add('loading section data', context => {
        const photoCount = 14
        const containerHeight = estimateContainerHeight(viewportWidth, defaultGridRowHeight, photoCount)
        return (
            <GridSection
                {...defaultProps}
                section={{
                    id: defaultSectionId,
                    title: defaultSectionId,
                    count: 14
                }}
                layout={{
                    sectionTop: 0,
                    containerHeight,
                    fromBoxIndex: 0,
                    toBoxIndex: photoCount,
                    boxes: createDummyLayoutBoxes(viewportWidth, defaultGridRowHeight, containerHeight, photoCount)
                }}
                selectedPhotoIds={null}
            />
        )
    })


    createDummyLayoutBoxes